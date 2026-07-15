import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import io

from core.database import get_db
from models.user import User, RoleEnum
from models.attendance import Attendance
from models.grade import Grade
from api.dependencies import RoleChecker
from services.export_service import build_csv, build_xlsx

router = APIRouter(prefix="/export", tags=["Export"])

require_view = RoleChecker([RoleEnum.SUPERADMIN, RoleEnum.ASPRAK])

MEDIA_TYPES = {
    "csv": "text/csv",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

UNAUTHENTICATED_401 = {401: {"description": "Missing or invalid session cookie."}}
STAFF_ONLY_403 = {403: {"description": "Requires superadmin/asprak, or a pending password change."}}
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
    description="Superadmin/asprak only. Downloads username/email/status for every student marked in the session.",
    responses=EXPORT_RESPONSES,  # type: ignore
)
async def export_attendance(
    session_id: uuid.UUID,
    format: str = Query("csv", pattern="^(csv|xlsx)$", description="Output file format: 'csv' or 'xlsx'."),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_view),
):
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
    content = build_xlsx(rows, headers) if format == "xlsx" else build_csv(rows, headers)
    return _stream(content, MEDIA_TYPES[format], f"attendance_{session_id}.{format}")


@router.get(
    "/grades/{session_id}",
    summary="Export a session's grades as CSV or XLSX",
    description="Superadmin/asprak only. Downloads username/email/score for every student graded in the session.",
    responses=EXPORT_RESPONSES,  # type: ignore
)
async def export_grades(
    session_id: uuid.UUID,
    format: str = Query("csv", pattern="^(csv|xlsx)$", description="Output file format: 'csv' or 'xlsx'."),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_view),
):
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
    content = build_xlsx(rows, headers) if format == "xlsx" else build_csv(rows, headers)
    return _stream(content, MEDIA_TYPES[format], f"grades_{session_id}.{format}")
