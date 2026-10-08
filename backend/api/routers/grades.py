import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.dialects.postgresql import insert

from core.database import get_db
from models.user import User, RoleEnum
from models.grade import Grade
from models.class_session import ClassSession
from models.course import Course
from models.enrollment import Enrollment
from models.assignment import Assignment, Submission
from schemas.grade import BulkGradeRequest, GradeResponse, PersonalGradeHistoryItem
from schemas.common import MessageResponse
from api.dependencies import get_current_active_user
from api.permissions import require_session_access, validate_enrolled_students

router = APIRouter(prefix="/grades", tags=["Grades"])

UNAUTHENTICATED_401 = {401: {"description": "Missing or invalid session cookie."}}
FORBIDDEN_403 = {403: {"description": "Caller isn't assigned to this session's course, has a read-only role, or a password change is pending."}}
SESSION_NOT_FOUND_404 = {404: {"description": "No class session exists with the given session_id."}}


@router.post(
    "/sessions/{session_id}/bulk",
    response_model=MessageResponse,
    summary="Bulk-record grades for a session",
    description=(
        "Superadmin, or an asprak assigned to the session's course. Upserts one score (0-100) "
        "per student for the given session — designed to be called once per grading pass with "
        "the full roster. Every student must be an active praktikan enrolled in the session's "
        "course."
    ),
    responses={
        **UNAUTHENTICATED_401,
        **FORBIDDEN_403,
        **SESSION_NOT_FOUND_404,
        422: {"description": "One or more student_ids are not enrolled praktikan accounts in this course, or a score is out of range."},
    },
)
async def bulk_update_grades(
    session_id: uuid.UUID,
    data: BulkGradeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_session_access(db, current_user, session_id, write=True)

    # Acquire row-level lock on session to prevent concurrent publish races
    sess_res = await db.execute(
        select(ClassSession).where(ClassSession.id == session_id).with_for_update()
    )
    session = sess_res.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Class session not found")

    if session.grades_published:
        raise HTTPException(status_code=409, detail="Cannot edit grades for a published session. Unpublish first.")

    if not data.records:
        return {"message": "No records to update"}

    deduped = {record.student_id: record for record in data.records}
    await validate_enrolled_students(db, session.course_id, list(deduped.keys()))

    values = [
        {
            "id": uuid.uuid4(),
            "session_id": session_id,
            "student_id": record.student_id,
            "score": record.score,
            "recorded_by": current_user.id,
        }
        for record in deduped.values()
    ]

    stmt = insert(Grade).values(values)
    stmt = stmt.on_conflict_do_update(
        constraint="uix_session_student_grade",
        set_={
            "score": stmt.excluded.score,
            "recorded_by": stmt.excluded.recorded_by,
            "updated_at": func.now(),
        },
    )

    await db.execute(stmt)
    await db.commit()

    return {"message": f"Successfully updated {len(values)} grade records"}


@router.get(
    "/sessions/{session_id}",
    response_model=list[GradeResponse],
    summary="List grades for a session",
    description=(
        "Superadmin, or an asprak assigned to the session's course. Returns every "
        "grade recorded for the given session."
    ),
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **SESSION_NOT_FOUND_404},
)
async def list_grades(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_session_access(db, current_user, session_id, write=False)
    if current_user.role == RoleEnum.PRAKTIKAN:
        raise HTTPException(status_code=403, detail="Students can only view their own grades via /grades/me")

    result = await db.execute(select(Grade).where(Grade.session_id == session_id))
    return result.scalars().all()


@router.post(
    "/sessions/{session_id}/publish",
    response_model=MessageResponse,
    summary="Publish grades for a session",
    description="Asprak only. Grades will become visible to Praktikan.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **SESSION_NOT_FOUND_404},
)
async def publish_grades(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session = await require_session_access(db, current_user, session_id, write=True)
    if session.grades_published:
        raise HTTPException(status_code=400, detail="Grades are already published for this session")

    session.grades_published = True
    session.grades_published_at = func.now()
    session.grades_published_by = current_user.id
    await db.commit()
    return {"message": "Grades successfully published."}


@router.post(
    "/sessions/{session_id}/unpublish",
    response_model=MessageResponse,
    summary="Unpublish grades for a session",
    description="Asprak only. Grades will be hidden from Praktikan.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **SESSION_NOT_FOUND_404},
)
async def unpublish_grades(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session = await require_session_access(db, current_user, session_id, write=True)
    if not session.grades_published:
        raise HTTPException(status_code=400, detail="Grades are not published for this session")

    session.grades_published = False
    session.grades_published_at = None
    session.grades_published_by = None
    await db.commit()
    return {"message": "Grades successfully unpublished."}


@router.get(
    "/me",
    response_model=list[PersonalGradeHistoryItem],
    summary="Get my own grade history",
    description="Returns the caller's own published grade records across all sessions with course metadata. Available to any authenticated role.",
    responses=UNAUTHENTICATED_401,  # type: ignore
)
async def my_grades(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session_res = await db.execute(
        select(Grade, ClassSession, Course)
        .join(ClassSession, Grade.session_id == ClassSession.id)
        .join(Course, ClassSession.course_id == Course.id)
        .where(Grade.student_id == current_user.id, ClassSession.grades_published.is_(True))
    )
    session_rows = session_res.all()

    assignment_res = await db.execute(
        select(Submission, Assignment, Course)
        .join(Assignment, Submission.assignment_id == Assignment.id)
        .join(Course, Assignment.course_id == Course.id)
        .where(
            Submission.student_id == current_user.id,
            Assignment.is_published.is_(True),
            Assignment.grades_published.is_(True),
            Submission.status == "graded",
            Submission.score.isnot(None),
        )
    )
    assignment_rows = assignment_res.all()

    items: list[PersonalGradeHistoryItem] = []
    for grade, session, course in session_rows:
        items.append(
            PersonalGradeHistoryItem(
                id=grade.id,
                session_id=grade.session_id,
                assignment_id=None,
                item_type="session",
                session_title=session.title,
                session_date=session.date,
                course_id=course.id,
                course_code=course.code,
                course_name=course.name,
                academic_year=course.academic_year,
                semester=course.semester,
                score=grade.score,
                max_points=100.0,
                feedback=None,
                created_at=grade.created_at,
                updated_at=grade.updated_at,
                recorded_by=grade.recorded_by,
            )
        )

    for sub, assignment, course in assignment_rows:
        # Always the assignment deadline (or None), so clients can label it "Due".
        item_date = assignment.due_date.date() if assignment.due_date else None

        items.append(
            PersonalGradeHistoryItem(
                id=sub.id,
                session_id=assignment.session_id,
                assignment_id=assignment.id,
                item_type="assignment",
                session_title=assignment.title,
                session_date=item_date,
                course_id=course.id,
                course_code=course.code,
                course_name=course.name,
                academic_year=course.academic_year,
                semester=course.semester,
                score=sub.score,
                max_points=float(assignment.max_points),
                feedback=sub.feedback,
                created_at=sub.submitted_at,
                updated_at=sub.graded_at or sub.submitted_at,
                recorded_by=sub.graded_by,
            )
        )

    items.sort(
        key=lambda x: (
            x.academic_year,
            x.semester,
            x.session_date.isoformat() if x.session_date else "",
            x.session_title,
        ),
        reverse=True,
    )
    return items
