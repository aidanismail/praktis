import uuid
from pydantic import BaseModel, ConfigDict, Field
from models.attendance import AttendanceStatus


class AttendanceUpdate(BaseModel):
    student_id: uuid.UUID = Field(..., description="Student whose attendance is being marked.")
    status: AttendanceStatus = Field(..., description="Attendance status: hadir, sakit, izin, or alfa.")

class BulkAttendanceRequest(BaseModel):
    records: list[AttendanceUpdate] = Field(..., description="Batch of per-student attendance statuses to upsert for a session.")

class AttendanceResponse(BaseModel):
    id: uuid.UUID = Field(..., description="Unique attendance record identifier.")
    session_id: uuid.UUID = Field(..., description="Class session this record belongs to.")
    student_id: uuid.UUID = Field(..., description="Student this record belongs to.")
    status: AttendanceStatus = Field(..., description="Attendance status: hadir, sakit, izin, or alfa.")

    model_config = ConfigDict(from_attributes=True)