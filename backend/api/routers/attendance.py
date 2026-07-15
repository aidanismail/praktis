import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.dialects.postgresql import insert

from core.database import get_db
from core.rate_limit import rate_limiter
from models.user import User, RoleEnum
from models.attendance import Attendance
from schemas.attendance import BulkAttendanceRequest, AttendanceResponse
from schemas.common import MessageResponse
from api.dependencies import RoleChecker, get_current_active_user

router = APIRouter(prefix="/attendance", tags=["Attendance"])

require_role = RoleChecker([RoleEnum.SUPERADMIN, RoleEnum.ASPRAK])
require_view = RoleChecker([RoleEnum.SUPERADMIN, RoleEnum.ASPRAK])

from typing import Any
UNAUTHENTICATED_401 = {401: {"description": "Missing or invalid session cookie."}}
STAFF_ONLY_403 = {403: {"description": "Requires superadmin/asprak, or a pending password change."}}


@router.post(
    "/sessions/{session_id}/bulk",
    response_model=MessageResponse,
    summary="Bulk-record attendance for a session",
    description=(
        "Superadmin/asprak only. Upserts one attendance status (hadir/sakit/izin/alfa) per "
        "student for the given session — designed to be called once per attendance-taking "
        "pass with the full roster. Rate-limited to 30 requests/minute per client IP."
    ),
    responses={**UNAUTHENTICATED_401, **STAFF_ONLY_403, 429: {"description": "Too many requests; slow down."}},  # type: ignore
    dependencies=[Depends(rate_limiter(times=30, seconds=60, scope="attendance_bulk"))],
)
async def bulk_update_attendance(
    session_id: uuid.UUID,
    data: BulkAttendanceRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role)
):

    if not data.records:
        return {"message": "No records to update"}

    values = [
        {
            "id": uuid.uuid4(),
            "session_id": session_id,
            "student_id": record.student_id,
            "status": record.status.value
        }
        for record in data.records
    ]

    stmt = insert(Attendance).values(values)
    stmt = stmt.on_conflict_do_update(
        constraint="uix_session_student",
        set_={"status": stmt.excluded.status}
    )

    await db.execute(stmt)
    await db.commit()

    return {"message": f"Successfully updated {len(values)} attendance records"}


@router.get(
    "/sessions/{session_id}",
    response_model=list[AttendanceResponse],
    summary="List attendance for a session",
    description="Superadmin/asprak only. Returns every attendance record recorded for the given session.",
    responses={**UNAUTHENTICATED_401, **STAFF_ONLY_403},  # type: ignore
)
async def list_session_attendance(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_view),
):
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
