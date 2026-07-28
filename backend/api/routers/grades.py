import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.dialects.postgresql import insert

from core.database import get_db
from models.user import User, RoleEnum
from models.grade import Grade
from schemas.grade import BulkGradeRequest, GradeResponse
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
    session = await require_session_access(db, current_user, session_id, write=True)

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


@router.get(
    "/me",
    response_model=list[GradeResponse],
    summary="Get my own grade history",
    description="Returns the caller's own grade records across all sessions. Available to any authenticated role.",
    responses=UNAUTHENTICATED_401,  # type: ignore
)
async def my_grades(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Grade).where(Grade.student_id == current_user.id))
    return result.scalars().all()
