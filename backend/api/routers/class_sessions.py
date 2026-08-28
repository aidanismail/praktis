import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.database import get_db
from models.user import User
from models.class_session import ClassSession
from schemas.course import ClassSessionResponse, ClassSessionUpdate
from schemas.common import MessageResponse
from api.dependencies import get_current_active_user
from api.permissions import require_session_access

router = APIRouter(prefix="/class-sessions", tags=["Class Sessions"])

UNAUTHENTICATED_401 = {401: {"description": "Missing or invalid session cookie."}}
FORBIDDEN_403 = {403: {"description": "Caller isn't assigned to this course."}}
SESSION_NOT_FOUND_404 = {404: {"description": "Class session not found."}}


async def _get_session_or_404(db: AsyncSession, session_id: uuid.UUID) -> ClassSession:
    result = await db.execute(select(ClassSession).where(ClassSession.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Class session not found")
    return session


@router.put(
    "/{session_id}",
    response_model=ClassSessionResponse,
    summary="Update a class session",
    description="Superadmin or assigned asprak. Update the title or date of an existing class session.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **SESSION_NOT_FOUND_404},
)
async def update_session(
    session_id: uuid.UUID,
    data: ClassSessionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session = await require_session_access(db, current_user, session_id, write=True)

    if data.title is not None:
        session.title = data.title
    if data.date is not None:
        session.date = data.date

    await db.commit()
    await db.refresh(session)
    return session


@router.post(
    "/{session_id}/open-attendance",
    response_model=MessageResponse,
    summary="Open attendance for a session",
    description=(
        "Superadmin or assigned asprak. Opens the attendance window for a specific class session, "
        "allowing attendance records to be submitted. Only one session per course can be open at a time."
    ),
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **SESSION_NOT_FOUND_404, 409: {"description": "Another session is already open."}},
)
async def open_attendance(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session = await require_session_access(db, current_user, session_id, write=True)

    if session.attendance_status == "OPEN":
        raise HTTPException(status_code=400, detail="Attendance is already open for this session")

    # Prevent opening if another session in the same course is currently OPEN (with row-level lock)
    result = await db.execute(
        select(ClassSession).where(
            ClassSession.course_id == session.course_id,
            ClassSession.attendance_status == "OPEN",
            ClassSession.id != session_id
        ).with_for_update()
    )
    if result.scalars().first():
        raise HTTPException(status_code=409, detail="Another session in this course currently has an open attendance window")

    session.attendance_status = "OPEN"
    await db.commit()
    return {"message": "Successfully opened attendance window for this session."}


@router.post(
    "/{session_id}/close-attendance",
    response_model=MessageResponse,
    summary="Close attendance for a session",
    description=(
        "Superadmin or assigned asprak. Closes the attendance window for a specific class session, "
        "preventing any further attendance records from being submitted."
    ),
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **SESSION_NOT_FOUND_404},
)
async def close_attendance(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session = await require_session_access(db, current_user, session_id, write=True)

    if session.attendance_status == "CLOSED":
        raise HTTPException(status_code=400, detail="Attendance is already closed for this session")

    session.attendance_status = "CLOSED"
    await db.commit()
    return {"message": "Successfully closed attendance window for this session."}
