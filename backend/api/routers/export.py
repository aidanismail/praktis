import asyncio
import io
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.database import get_db
from models.user import User, RoleEnum
from models.attendance import Attendance
from models.grade import Grade
from api.dependencies import get_current_active_user
from api.permissions import require_session_access
from services.export_service import build_csv, build_xlsx

router = APIRouter(prefix="/export", tags=["Export"])

MEDIA_TYPES = {
    "csv": "text/csv",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

UNAUTHENTICATED_401 = {401: {"description": "Missing or invalid session cookie."}}
STAFF_ONLY_403 = {403: {"description": "Caller isn't assigned to this session's course, or a password change is pending."}}
EXPORT_RESPONSES = {
    200: {
        "description": "File download containing one row per student.",
        "content": {
            "text/csv": {},
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {},
        },
    },
    **UNAUTHENTICATED_401,
    **STAFF_ONLY_403,
    404: {"description": "No records exist for this session yet."},
}


def _stream(content: bytes, media_type: str, filename: str) -> StreamingResponse:
    return StreamingResponse(
        io.BytesIO(content),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/attendance/{session_id}",
    summary="Export a session's attendance as CSV or XLSX",
    description="Superadmin, or an asprak assigned to the session's course. Downloads username/email/status for every student marked in the session.",
    responses=EXPORT_RESPONSES,  # type: ignore
)
async def export_attendance(
    session_id: uuid.UUID,
    format: str = Query("csv", pattern="^(csv|xlsx)$", description="Output file format: 'csv' or 'xlsx'."),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_session_access(db, current_user, session_id, write=False)
    if current_user.role == RoleEnum.PRAKTIKAN:
        raise HTTPException(status_code=403, detail="Students cannot export session records")

    result = await db.execute(
        select(Attendance, User.username, User.email)
        .join(User, User.id == Attendance.student_id)
        .where(Attendance.session_id == session_id)
    )
    rows = [
        {"username": username, "email": email, "status": attendance.status.value}
        for attendance, username, email in result.all()
    ]
    if not rows:
        raise HTTPException(status_code=404, detail="No attendance records found for this session")

    headers = ["username", "email", "status"]
    builder_fn = build_xlsx if format == "xlsx" else build_csv
    content = await asyncio.to_thread(builder_fn, rows, headers)
    return _stream(content, MEDIA_TYPES[format], f"attendance_{session_id}.{format}")


@router.get(
    "/grades/{session_id}",
    summary="Export a session's grades as CSV or XLSX",
    description="Superadmin, or an asprak assigned to the session's course. Downloads username/email/score for every student graded in the session.",
    responses=EXPORT_RESPONSES,  # type: ignore
)
async def export_grades(
    session_id: uuid.UUID,
    format: str = Query("csv", pattern="^(csv|xlsx)$", description="Output file format: 'csv' or 'xlsx'."),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_session_access(db, current_user, session_id, write=False)
    if current_user.role == RoleEnum.PRAKTIKAN:
        raise HTTPException(status_code=403, detail="Students cannot export session records")

    result = await db.execute(
        select(Grade, User.username, User.email)
        .join(User, User.id == Grade.student_id)
        .where(Grade.session_id == session_id)
    )
    rows = [
        {"username": username, "email": email, "score": grade.score}
        for grade, username, email in result.all()
    ]
    if not rows:
        raise HTTPException(status_code=404, detail="No grade records found for this session")

    headers = ["username", "email", "score"]
    builder_fn = build_xlsx if format == "xlsx" else build_csv
    content = await asyncio.to_thread(builder_fn, rows, headers)
    return _stream(content, MEDIA_TYPES[format], f"grades_{session_id}.{format}")
