import uuid
from datetime import date, datetime
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
    created_at: datetime = Field(..., description="When this record was first created.")
    updated_at: datetime = Field(..., description="When this record was last changed.")
    recorded_by: uuid.UUID | None = Field(None, description="User who last recorded this status.")

    model_config = ConfigDict(from_attributes=True)


class PersonalAttendanceHistoryItem(BaseModel):
    id: uuid.UUID = Field(..., description="Unique attendance record identifier.")
    session_id: uuid.UUID = Field(..., description="Class session this record belongs to.")
    session_title: str = Field(..., description="Title of the class session.")
    session_date: date | None = Field(None, description="Date of the class session.")
    course_id: uuid.UUID = Field(..., description="Course this record belongs to.")
    course_code: str = Field(..., description="Course code (e.g. IF101).")
    course_name: str = Field(..., description="Course name.")
    academic_year: str = Field(..., description="Academic year (e.g. 2025/2026).")
    semester: str = Field(..., description="Semester (Ganjil/Genap).")
    status: AttendanceStatus = Field(..., description="Attendance status: hadir, sakit, izin, or alfa.")
    created_at: datetime = Field(..., description="When this record was first created.")
    updated_at: datetime = Field(..., description="When this record was last changed.")
    recorded_by: uuid.UUID | None = Field(None, description="User who last recorded this status.")

    model_config = ConfigDict(from_attributes=True)