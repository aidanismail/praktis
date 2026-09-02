import io
import uuid
import datetime
import logging
import os
import re
import asyncio
import unicodedata
import zipfile
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from core.config import settings
from core.database import get_db
from api.dependencies import get_current_active_user
from api.permissions import require_course_access
from models.user import User, RoleEnum
from models.assignment import Assignment, Submission
from models.class_session import ClassSession
from schemas.assignment import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    SubmissionResponse,
    GradeSubmissionRequest,
)
from services.storage_service import storage_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/courses/{course_id}/assignments", tags=["Assignments"])

MAGIC_SIGNATURES: dict[str, bytes] = {
    "pdf": b"%PDF-",
    "docx": b"PK\x03\x04",
    "zip": b"PK\x03\x04",
}

ZIP_MAX_ENTRIES = 100
ZIP_MAX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024

_SAFE_FILENAME_RE = re.compile(r"[^a-zA-Z0-9._-]")
_MAX_DISPLAY_FILENAME_LEN = 200

UNAUTHENTICATED_401 = {401: {"description": "Missing or invalid session cookie."}}
FORBIDDEN_403 = {403: {"description": "Caller lacks enrollment or assignment permissions for this course."}}
NOT_FOUND_404 = {404: {"description": "Course or assignment not found."}}
BAD_REQUEST_400 = {400: {"description": "Invalid file format, excessive file size, or submission validation error."}}
CONFLICT_409 = {409: {"description": "Concurrent submission conflict."}}

def _sanitize_filename(raw: str, ext: str) -> str:
    """Normalize an uploaded filename: basename only, safe chars, bounded."""
    name = os.path.basename(raw)
    stem = os.path.splitext(name)[0]
    stem = unicodedata.normalize("NFKD", stem)
    stem = _SAFE_FILENAME_RE.sub("_", stem)
    stem = stem.strip("_") or "submission"
    max_stem = _MAX_DISPLAY_FILENAME_LEN - len(ext) - 1
    stem = stem[:max_stem]
    return f"{stem}.{ext}"


def _validate_zip_safety(content: bytes) -> None:
    """Check a ZIP archive for entry count, path traversal, and size."""
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            entries = zf.infolist()
            if len(entries) > ZIP_MAX_ENTRIES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"ZIP archive exceeds {ZIP_MAX_ENTRIES} entries",
                )
            total_uncompressed = 0
            for entry in entries:
                if ".." in entry.filename or entry.filename.startswith("/"):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="ZIP archive contains unsafe path",
                    )
                total_uncompressed += entry.file_size
                if total_uncompressed > ZIP_MAX_UNCOMPRESSED_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="ZIP archive uncompressed size exceeds limit",
                    )
    except zipfile.BadZipFile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ZIP archive",
        )



def _build_submission_response(sub: Submission, student: User | None) -> SubmissionResponse:
    download_url = storage_service.generate_presigned_download_url(sub.file_key)
    return SubmissionResponse(
        id=str(sub.id),
        assignment_id=str(sub.assignment_id),
        student_id=str(sub.student_id),
        student_username=student.username if student else "Unknown",
        student_email=student.email if student else None,
        file_name=sub.file_name,
        file_size=sub.file_size,
        download_url=download_url,
        submitted_at=sub.submitted_at.isoformat() if sub.submitted_at else "",
        is_late=sub.is_late,
        score=sub.score,
        feedback=sub.feedback,
        graded_by=str(sub.graded_by) if sub.graded_by else None,
        graded_at=sub.graded_at.isoformat() if sub.graded_at else None,
        status=sub.status,
    )


@router.get(
    "",
    response_model=list[AssignmentResponse],
    summary="List course assignments",
    description=(
        "Returns all assignments in a course. For students (Praktikan), only published assignments are returned, "
        "and their personal submission status is populated in `my_submission`. "
        "For staff (Asprak/Superadmin), all draft and published assignments are returned with `submissions_count`."
    ),
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **NOT_FOUND_404},
)
async def list_assignments(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, course_id, write=False)

    query = select(Assignment).where(Assignment.course_id == course_id).options(selectinload(Assignment.submissions))
    if current_user.role == RoleEnum.PRAKTIKAN:
        query = query.where(Assignment.is_published.is_(True))

    query = query.order_by(Assignment.created_at.desc())
    result = await db.execute(query)
    assignments = result.scalars().all()

    # If praktikan, find their own submission
    my_submissions_map = {}
    if current_user.role == RoleEnum.PRAKTIKAN:
        sub_res = await db.execute(
            select(Submission).where(
                Submission.assignment_id.in_([a.id for a in assignments]),
                Submission.student_id == current_user.id,
            )
        )
        my_submissions_map = {s.assignment_id: s for s in sub_res.scalars().all()}

    response_items = []
    for a in assignments:
        my_sub_resp = None
        if current_user.role == RoleEnum.PRAKTIKAN and a.id in my_submissions_map:
            my_sub_resp = _build_submission_response(my_submissions_map[a.id], current_user)

        response_items.append(
            AssignmentResponse(
                id=str(a.id),
                course_id=str(a.course_id),
                session_id=str(a.session_id) if a.session_id else None,
                title=a.title,
                description=a.description,
                due_date=a.due_date.isoformat() if a.due_date else None,
                max_points=a.max_points,
                allowed_file_types=a.allowed_file_types,
                is_published=a.is_published,
                created_at=a.created_at.isoformat(),
                submissions_count=len(a.submissions),
                my_submission=my_sub_resp,
            )
        )

    return response_items


@router.post(
    "",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create classwork assignment",
    description="Creates a new assignment task with optional due date, rubric max points, and allowed file formats. Requires Asprak or Superadmin.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **NOT_FOUND_404},
)
async def create_assignment(
    course_id: uuid.UUID,
    payload: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, course_id, write=True)

    if payload.session_id is not None:
        sess_res = await db.execute(
            select(ClassSession).where(
                ClassSession.id == payload.session_id,
                ClassSession.course_id == course_id,
            )
        )
        if not sess_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected session does not belong to this course",
            )

    new_assignment = Assignment(
        course_id=course_id,
        session_id=payload.session_id,
        title=payload.title,
        description=payload.description,
        due_date=payload.due_date,
        max_points=payload.max_points,
        allowed_file_types=payload.allowed_file_types,
        is_published=payload.is_published,
        created_by=current_user.id,
    )
    db.add(new_assignment)
    await db.commit()
    await db.refresh(new_assignment)

    return AssignmentResponse(
        id=str(new_assignment.id),
        course_id=str(new_assignment.course_id),
        session_id=str(new_assignment.session_id) if new_assignment.session_id else None,
        title=new_assignment.title,
        description=new_assignment.description,
        due_date=new_assignment.due_date.isoformat() if new_assignment.due_date else None,
        max_points=new_assignment.max_points,
        allowed_file_types=new_assignment.allowed_file_types,
        is_published=new_assignment.is_published,
        created_at=new_assignment.created_at.isoformat(),
        submissions_count=0,
        my_submission=None,
    )


@router.get(
    "/{assignment_id}",
    response_model=AssignmentResponse,
    summary="Get assignment details",
    description="Retrieves assignment metadata, instructions, due date, and user submission state.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **NOT_FOUND_404},
)
async def get_assignment(
    course_id: uuid.UUID,
    assignment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, course_id, write=False)

    result = await db.execute(
        select(Assignment)
        .where(Assignment.id == assignment_id, Assignment.course_id == course_id)
        .options(selectinload(Assignment.submissions))
    )
    assignment = result.scalars().first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    if current_user.role == RoleEnum.PRAKTIKAN and not assignment.is_published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    my_sub_resp = None
    if current_user.role == RoleEnum.PRAKTIKAN:
        sub_res = await db.execute(
            select(Submission).where(
                Submission.assignment_id == assignment.id,
                Submission.student_id == current_user.id,
            )
        )
        my_sub = sub_res.scalars().first()
        if my_sub:
            my_sub_resp = _build_submission_response(my_sub, current_user)

    return AssignmentResponse(
        id=str(assignment.id),
        course_id=str(assignment.course_id),
        session_id=str(assignment.session_id) if assignment.session_id else None,
        title=assignment.title,
        description=assignment.description,
        due_date=assignment.due_date.isoformat() if assignment.due_date else None,
        max_points=assignment.max_points,
        allowed_file_types=assignment.allowed_file_types,
        is_published=assignment.is_published,
        created_at=assignment.created_at.isoformat(),
        submissions_count=len(assignment.submissions),
        my_submission=my_sub_resp,
    )


@router.patch(
    "/{assignment_id}",
    response_model=AssignmentResponse,
    summary="Update classwork assignment",
    description="Modifies assignment title, instructions, due date, points, or publication status. Requires Asprak or Superadmin.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **NOT_FOUND_404},
)
async def update_assignment(
    course_id: uuid.UUID,
    assignment_id: uuid.UUID,
    payload: AssignmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, course_id, write=True)

    result = await db.execute(
        select(Assignment)
        .where(Assignment.id == assignment_id, Assignment.course_id == course_id)
        .options(selectinload(Assignment.submissions))
    )
    assignment = result.scalars().first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(assignment, field, value)

    await db.commit()
    await db.refresh(assignment)

    return AssignmentResponse(
        id=str(assignment.id),
        course_id=str(assignment.course_id),
        session_id=str(assignment.session_id) if assignment.session_id else None,
        title=assignment.title,
        description=assignment.description,
        due_date=assignment.due_date.isoformat() if assignment.due_date else None,
        max_points=assignment.max_points,
        allowed_file_types=assignment.allowed_file_types,
        is_published=assignment.is_published,
        created_at=assignment.created_at.isoformat(),
        submissions_count=len(assignment.submissions),
        my_submission=None,
    )


@router.delete(
    "/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete classwork assignment",
    description="Deletes an assignment and all student submissions from database and storage. Requires Asprak or Superadmin.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **NOT_FOUND_404},
)
async def delete_assignment(
    course_id: uuid.UUID,
    assignment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, course_id, write=True)

    result = await db.execute(
        select(Assignment).where(Assignment.id == assignment_id, Assignment.course_id == course_id)
    )
    assignment = result.scalars().first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    sub_res = await db.execute(select(Submission).where(Submission.assignment_id == assignment.id))
    for sub in sub_res.scalars().all():
        try:
            await storage_service.delete_object(sub.file_key)
        except Exception:
            pass

    await db.delete(assignment)
    await db.commit()


@router.post(
    "/{assignment_id}/submit",
    response_model=SubmissionResponse,
    summary="Submit assignment solution file",
    description=(
        "Enrolled student (Praktikan) upload for assignment tasks. "
        "Reads the file with a bounded buffer (stops at the configured limit), "
        "validates file content via magic-byte signatures and archive safety checks, "
        "sanitizes the filename, and stores the object in MinIO with a generated key. "
        "Automatically calculates `is_late` based on assignment due date. "
        "Resubmission replaces the existing submission and clears all grading state."
    ),
    responses={
        **UNAUTHENTICATED_401,
        **FORBIDDEN_403,
        **NOT_FOUND_404,
        **BAD_REQUEST_400,
        **CONFLICT_409,
    },
)
async def submit_assignment(
    course_id: uuid.UUID,
    assignment_id: uuid.UUID,
    file: UploadFile = File(
        ...,
        description=(
            "Practicum assignment solution file (PDF/ZIP/DOCX). "
            f"Maximum size is configured via ASSIGNMENT_MAX_UPLOAD_BYTES."
        ),
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    max_bytes = settings.ASSIGNMENT_MAX_UPLOAD_BYTES

    await require_course_access(db, current_user, course_id, write=False)

    if current_user.role != RoleEnum.PRAKTIKAN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can submit assignments")

    result = await db.execute(
        select(Assignment).where(Assignment.id == assignment_id, Assignment.course_id == course_id)
    )
    assignment = result.scalars().first()
    if not assignment or not assignment.is_published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    ext = os.path.splitext(file.filename or "")[1].lower().lstrip(".")
    allowed = [t.strip().lower().lstrip(".") for t in assignment.allowed_file_types.split(",")]
    if ext not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension .{ext} not allowed. Allowed types: {assignment.allowed_file_types}",
        )

    chunks: list[bytes] = []
    total = 0
    while True:
        chunk = await file.read(64 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum size of {max_bytes // (1024 * 1024)}MB",
            )
        chunks.append(chunk)
    content = b"".join(chunks)
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    expected_magic = MAGIC_SIGNATURES.get(ext)
    if expected_magic and not content.startswith(expected_magic):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File content does not match .{ext} format",
        )

    if ext in ("zip", "docx"):
        _validate_zip_safety(content)

    display_name = _sanitize_filename(file.filename or "submission", ext)

    file_key = f"assignments/{assignment_id}/{current_user.id}/{uuid.uuid4()}.{ext}"
    if len(file_key) > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Generated file key exceeds storage limit",
        )

    await asyncio.to_thread(
        storage_service.internal.put_object,
        Bucket=storage_service.bucket_name,
        Key=file_key,
        Body=content,
    )

    now = datetime.datetime.now(datetime.timezone.utc)
    is_late = False
    if assignment.due_date:
        due = assignment.due_date
        if due.tzinfo is None:
            due = due.replace(tzinfo=datetime.timezone.utc)
        if now > due:
            is_late = True

    try:
        sub_res = await db.execute(
            select(Submission)
            .where(
                Submission.assignment_id == assignment.id,
                Submission.student_id == current_user.id,
            )
            .with_for_update()
        )
        submission = sub_res.scalars().first()
        old_file_key = None

        if submission:
            old_file_key = submission.file_key
            submission.file_key = file_key
            submission.file_name = display_name
            submission.file_size = len(content)
            submission.submitted_at = now
            submission.is_late = is_late
            submission.score = None
            submission.feedback = None
            submission.graded_by = None
            submission.graded_at = None
            submission.status = "submitted"
        else:
            submission = Submission(
                assignment_id=assignment.id,
                student_id=current_user.id,
                file_key=file_key,
                file_name=display_name,
                file_size=len(content),
                submitted_at=now,
                is_late=is_late,
                status="submitted",
            )
            db.add(submission)

        await db.commit()
        await db.refresh(submission)

    except IntegrityError:
        await db.rollback()
        try:
            await asyncio.to_thread(
                storage_service.internal.delete_object,
                Bucket=storage_service.bucket_name,
                Key=file_key,
            )
        except Exception:
            logger.warning("Failed to clean up orphan object %s after conflict", file_key)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Concurrent submission conflict; please retry",
        )
    except Exception:
        try:
            await asyncio.to_thread(
                storage_service.internal.delete_object,
                Bucket=storage_service.bucket_name,
                Key=file_key,
            )
        except Exception:
            logger.warning("Failed to clean up object %s after DB failure", file_key)
        raise

    if old_file_key:
        try:
            await storage_service.delete_object(old_file_key)
        except Exception:
            logger.warning("Failed to delete replaced submission object: %s", old_file_key)

    try:
        return _build_submission_response(submission, current_user)
    except Exception:
        logger.warning("Presigned URL generation failed for submission %s", submission.id)
        return SubmissionResponse(
            id=str(submission.id),
            assignment_id=str(submission.assignment_id),
            student_id=str(submission.student_id),
            student_username=current_user.username,
            student_email=current_user.email,
            file_name=submission.file_name,
            file_size=submission.file_size,
            download_url="",
            submitted_at=submission.submitted_at.isoformat() if submission.submitted_at else "",
            is_late=submission.is_late,
            score=submission.score,
            feedback=submission.feedback,
            graded_by=str(submission.graded_by) if submission.graded_by else None,
            graded_at=submission.graded_at.isoformat() if submission.graded_at else None,
            status=submission.status,
        )


@router.get(
    "/{assignment_id}/submissions",
    response_model=list[SubmissionResponse],
    summary="List all student submissions",
    description="Retrieves all student submission files, timestamps, and grade status for an assignment. Requires Asprak or Superadmin.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **NOT_FOUND_404},
)
async def list_assignment_submissions(
    course_id: uuid.UUID,
    assignment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, course_id, write=True)

    assign_res = await db.execute(
        select(Assignment).where(Assignment.id == assignment_id, Assignment.course_id == course_id)
    )
    if not assign_res.scalars().first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    result = await db.execute(
        select(Submission).where(Submission.assignment_id == assignment_id).order_by(Submission.submitted_at.desc())
    )
    submissions = result.scalars().all()

    student_ids = {s.student_id for s in submissions}
    users_map = {}
    if student_ids:
        u_res = await db.execute(select(User).where(User.id.in_(student_ids)))
        users_map = {u.id: u for u in u_res.scalars().all()}

    return [_build_submission_response(s, users_map.get(s.student_id)) for s in submissions]


@router.post(
    "/{assignment_id}/submissions/{submission_id}/grade",
    response_model=SubmissionResponse,
    summary="Grade student submission",
    description="Assigns numeric score points and text feedback to a student assignment submission. Requires Asprak or Superadmin.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **NOT_FOUND_404, **BAD_REQUEST_400},
)
async def grade_submission(
    course_id: uuid.UUID,
    assignment_id: uuid.UUID,
    submission_id: uuid.UUID,
    payload: GradeSubmissionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, course_id, write=True)

    assign_res = await db.execute(
        select(Assignment).where(Assignment.id == assignment_id, Assignment.course_id == course_id)
    )
    assignment = assign_res.scalars().first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    if payload.score < 0 or payload.score > assignment.max_points:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Score must be between 0 and {assignment.max_points}",
        )

    result = await db.execute(
        select(Submission).where(
            Submission.id == submission_id,
            Submission.assignment_id == assignment_id,
        )
    )
    submission = result.scalars().first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    submission.score = payload.score
    submission.feedback = payload.feedback
    submission.graded_by = current_user.id
    submission.graded_at = datetime.datetime.now(datetime.timezone.utc)
    submission.status = "graded"

    await db.commit()
    await db.refresh(submission)

    st_res = await db.execute(select(User).where(User.id == submission.student_id))
    student = st_res.scalars().first()

    return _build_submission_response(submission, student)
