import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.dialects.postgresql import insert

from core.database import get_db
from models.user import User, RoleEnum
from models.grade import Grade
from schemas.grade import BulkGradeRequest, GradeResponse
from schemas.common import MessageResponse
from api.dependencies import RoleChecker

router = APIRouter(prefix="/grades", tags=["Grades"])

require_staff = RoleChecker([RoleEnum.SUPERADMIN, RoleEnum.ASPRAK])
require_view = RoleChecker([RoleEnum.SUPERADMIN, RoleEnum.ASPRAK])

UNAUTHENTICATED_401 = {401: {"description": "Missing or invalid session cookie."}}
STAFF_ONLY_403 = {403: {"description": "Requires superadmin/asprak, or a pending password change."}}


@router.post(
    "/sessions/{session_id}/bulk",
    response_model=MessageResponse,
    summary="Bulk-record grades for a session",
    description=(
        "Superadmin/asprak only. Upserts one score per student for the given session — "
        "designed to be called once per grading pass with the full roster."
    ),
    responses={**UNAUTHENTICATED_401, **STAFF_ONLY_403},
)
async def bulk_update_grades(
    session_id: uuid.UUID,
    data: BulkGradeRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_staff),
):
    if not data.records:
        return {"message": "No records to update"}

    values = [
        {
            "id": uuid.uuid4(),
            "session_id": session_id,
            "student_id": record.student_id,
            "score": record.score,
        }
        for record in data.records
    ]

    stmt = insert(Grade).values(values)
    stmt = stmt.on_conflict_do_update(
        constraint="uix_session_student_grade",
        set_={"score": stmt.excluded.score},
    )

    await db.execute(stmt)
    await db.commit()

    return {"message": f"Successfully updated {len(values)} grade records"}


@router.get(
    "/sessions/{session_id}",
    response_model=list[GradeResponse],
    summary="List grades for a session",
    description="Superadmin/asprak only. Returns every grade recorded for the given session.",
    responses={**UNAUTHENTICATED_401, **STAFF_ONLY_403},
)
async def list_grades(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_view),
):
    result = await db.execute(select(Grade).where(Grade.session_id == session_id))
    return result.scalars().all()
