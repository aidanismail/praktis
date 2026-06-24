import uuid
from pydantic import BaseModel
from models.attendance import AttendanceStatus

class AttendanceUpdate(BaseModel):
    student_id: uuid.UUID
    status: AttendanceStatus

class BulkAttendanceRequest(BaseModel):
    records: list[AttendanceUpdate]