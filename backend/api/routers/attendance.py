import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.dialects.postgresql import insert

from core.database import get_db
from core.rate_limit import rate_limiter
from models.user import User, RoleEnum
from models.attendance import Attendance
from schemas.attendance import BulkAttendanceRequest, AttendanceResponse
from schemas.common import MessageResponse
from api.dependencies import get_current_active_user
from api.permissions import require_session_access, validate_enrolled_students

router = APIRouter(prefix="/attendance", tags=["Attendance"])

UNAUTHENTICATED_401 = {401: {"description": "Missing or invalid session cookie."}}
FORBIDDEN_403 = {403: {"description": "Caller isn't assigned to this session's course, has a read-only role, or a password change is pending."}}
SESSION_NOT_FOUND_404 = {404: {"description": "No class session exists with the given session_id."}}


@router.post(
    "/sessions/{session_id}/bulk",
    response_model=MessageResponse,
    summary="Bulk-record attendance for a session",
    description=(
        "Superadmin, or an asprak assigned to the session's course. Upserts one attendance "
        "status (hadir/sakit/izin/alfa) per student for the given session — designed to be "
        "called once per attendance-taking pass with the full roster. Every student must be "
        "an active praktikan enrolled in the session's course. Rate-limited to 30 "
        "requests/minute per client IP."
    ),
    responses={
        **UNAUTHENTICATED_401,
        **FORBIDDEN_403,
        **SESSION_NOT_FOUND_404,
        422: {"description": "One or more student_ids are not enrolled praktikan accounts in this course."},
        429: {"description": "Too many requests; slow down."},
    },
    dependencies=[Depends(rate_limiter(times=30, seconds=60, scope="attendance_bulk"))],
)
async def bulk_update_attendance(
    session_id: uuid.UUID,
    data: BulkAttendanceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session = await require_session_access(db, current_user, session_id, write=True)

    if session.attendance_status != "OPEN" and current_user.role != RoleEnum.SUPERADMIN:
        raise HTTPException(status_code=400, detail="Attendance window is not open for this session")

    if not data.records:
        return {"message": "No records to update"}

    deduped = {record.student_id: record for record in data.records}
    await validate_enrolled_students(db, session.course_id, list(deduped.keys()))

    values = [
        {
            "id": uuid.uuid4(),
            "session_id": session_id,
            "student_id": record.student_id,
            "status": record.status.value,
            "recorded_by": current_user.id,
        }
        for record in deduped.values()
    ]

    stmt = insert(Attendance).values(values)
    stmt = stmt.on_conflict_do_update(
        constraint="uix_session_student",
        set_={
            "status": stmt.excluded.status,
            "recorded_by": stmt.excluded.recorded_by,
            "updated_at": func.now(),
        },
    )

    await db.execute(stmt)
    await db.commit()

    return {"message": f"Successfully updated {len(values)} attendance records"}


@router.get(
    "/sessions/{session_id}",
    response_model=list[AttendanceResponse],
    summary="List attendance for a session",
    description=(
        "Superadmin, or an asprak assigned to the session's course. Returns every "
        "attendance record recorded for the given session."
    ),
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **SESSION_NOT_FOUND_404},  # type: ignore
)
async def list_session_attendance(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_session_access(db, current_user, session_id, write=False)
    if current_user.role == RoleEnum.PRAKTIKAN:
        raise HTTPException(status_code=403, detail="Students can only view their own attendance via /attendance/me")

    result = await db.execute(select(Attendance).where(Attendance.session_id == session_id))
    return result.scalars().all()


@router.get(
    "/me",
    response_model=list[AttendanceResponse],
    summary="Get my own attendance history",
    description="Returns the caller's own attendance records across all sessions. Available to any authenticated role.",
    responses=UNAUTHENTICATED_401,  # type: ignore
)
async def my_attendance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Attendance).where(Attendance.student_id == current_user.id))
    return result.scalars().all()
