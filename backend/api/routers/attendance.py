import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from core.database import get_db
from models.user import User, RoleEnum
from models.attendance import Attendance
from schemas.attendance import BulkAttendanceRequest
from api.dependencies import RoleChecker

router = APIRouter(prefix="/attendance", tags=["Attendance"])

require_role = RoleChecker([RoleEnum.SUPERADMIN, RoleEnum.ASPRAK])

@router.post("/sessions/{session_id}/bulk")
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