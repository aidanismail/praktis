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
from models.assignment import Assignment, Submission
from models.enrollment import Enrollment
from api.dependencies import get_current_active_user
from api.permissions import require_course_access, require_session_access
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
    "/assignments/{assignment_id}",
    summary="Export an assignment's grades as CSV or XLSX",
    description=(
        "Superadmin, or an asprak assigned to the assignment's course. One row per enrolled "
        "student; students without a submission are listed with status 'missing'."
    ),
    responses={
        **EXPORT_RESPONSES,  # type: ignore
        404: {"description": "Assignment not found, or the course has no enrolled students."},
    },
)
async def export_assignment_grades(
    assignment_id: uuid.UUID,
    format: str = Query("csv", pattern="^(csv|xlsx)$", description="Output file format: 'csv' or 'xlsx'."),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    assignment = (
        await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    ).scalars().first()
    if assignment is None:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # write=True rejects praktikan and unassigned asprak.
    await require_course_access(db, current_user, assignment.course_id, write=True)

    result = await db.execute(
        select(User, Submission)
        .join(Enrollment, Enrollment.student_id == User.id)
        .outerjoin(
            Submission,
            (Submission.student_id == User.id) & (Submission.assignment_id == assignment_id),
        )
        .where(Enrollment.course_id == assignment.course_id)
        .order_by(User.username)
    )
    rows = [
        {
            "username": student.username,
            "name": student.name or "",
            "email": student.email,
            "status": submission.status if submission else "missing",
            "submitted_at": submission.submitted_at.isoformat() if submission and submission.submitted_at else "",
            "is_late": submission.is_late if submission else "",
            "score": submission.score if submission and submission.score is not None else "",
            "max_points": assignment.max_points,
            "feedback": (submission.feedback or "") if submission else "",
        }
        for student, submission in result.all()
    ]
    if not rows:
        raise HTTPException(status_code=404, detail="No students are enrolled in this course")

    headers = ["username", "name", "email", "status", "submitted_at", "is_late", "score", "max_points", "feedback"]
    builder_fn = build_xlsx if format == "xlsx" else build_csv
    content = await asyncio.to_thread(builder_fn, rows, headers)
    return _stream(content, MEDIA_TYPES[format], f"grades_{assignment_id}.{format}")
