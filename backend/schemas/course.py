import uuid
import datetime
from datetime import date as date_type
from pydantic import BaseModel, ConfigDict, Field
from typing import Literal
from models.user import RoleEnum


class CourseCreate(BaseModel):
    code: str = Field(..., description="Unique course code.", examples=["IF101"])
    name: str = Field(..., description="Human-readable course name.", examples=["Praktikum Pemrograman"])
    academic_year: str = Field(..., description="Academic year of the offering.", examples=["2025/2026"])
    semester: Literal["Ganjil", "Genap"] = Field(..., description="Semester of the offering.")
    is_active: bool = Field(True, description="Whether this offering is currently active.")
    banner_theme_id: str | None = Field(None, max_length=50, description="Preset theme ID for banner.")
    banner_pattern_id: str | None = Field(None, max_length=50, description="Preset pattern ID for banner.")
    banner_image_url: str | None = Field(None, max_length=500, description="Custom banner image URL.")

class CourseUpdate(BaseModel):
    code: str | None = Field(None, description="Updated course code.")
    name: str | None = Field(None, description="Updated course name.")
    academic_year: str | None = Field(None, description="Updated academic year.")
    semester: Literal["Ganjil", "Genap"] | None = Field(None, description="Updated semester.")
    is_active: bool | None = Field(None, description="Updated active status.")
    banner_theme_id: str | None = Field(None, max_length=50, description="Preset theme ID for banner.")
    banner_pattern_id: str | None = Field(None, max_length=50, description="Preset pattern ID for banner.")
    banner_image_url: str | None = Field(None, max_length=500, description="Custom banner image URL.")

class CourseBannerUpdate(BaseModel):
    banner_theme_id: str | None = Field(None, max_length=50, description="Preset theme ID for banner.")
    banner_pattern_id: str | None = Field(None, max_length=50, description="Preset pattern ID for banner.")
    banner_image_url: str | None = Field(None, max_length=500, description="Custom banner image URL.")

class CourseResponse(BaseModel):
    id: uuid.UUID = Field(..., description="Unique course identifier.")
    code: str = Field(..., description="Unique course code.", examples=["IF101"])
    name: str = Field(..., description="Human-readable course name.", examples=["Praktikum Pemrograman"])
    academic_year: str = Field(..., description="Academic year of the offering.", examples=["2025/2026"])
    semester: str = Field(..., description="Semester of the offering.")
    is_active: bool = Field(..., description="Whether this offering is currently active.")
    banner_theme_id: str | None = Field(None, description="Preset theme ID for banner.")
    banner_pattern_id: str | None = Field(None, description="Preset pattern ID for banner.")
    banner_image_url: str | None = Field(None, description="Custom banner image URL.")

    model_config = ConfigDict(from_attributes=True)


class EnrollRequest(BaseModel):
    usernames: list[str] = Field(
        ..., description="Usernames (NPMs) of students to enroll in this course.", examples=[["140810220001", "140810220002"]]
    )

class ClassSessionCreate(BaseModel):
    title: str = Field(..., description="Title of the session/meeting.", examples=["Pertemuan 1"])
    date: date_type = Field(..., description="Date the session takes place.")

class ClassSessionUpdate(BaseModel):
    title: str | None = Field(None, description="New title of the session/meeting.")
    date: date_type | None = Field(None, description="New date the session takes place.")

class ClassSessionResponse(BaseModel):
    id: uuid.UUID = Field(..., description="Unique session identifier.")
    course_id: uuid.UUID = Field(..., description="Course this session belongs to.")
    title: str = Field(..., description="Title of the session/meeting.")
    date: date_type = Field(..., description="Date the session takes place.")
    attendance_status: str = Field(..., description="Attendance window status (SCHEDULED, OPEN, CLOSED).")
    grades_published: bool = Field(..., description="Whether grades for this session have been published.")
    grades_published_at: datetime.datetime | None = Field(None, description="When the grades were published.")
    grades_published_by: uuid.UUID | None = Field(None, description="Who published the grades.")

    model_config = ConfigDict(from_attributes=True)

class EnrolledStudentResponse(BaseModel):
    id: uuid.UUID = Field(..., description="Unique student (user) identifier.")
    username: str = Field(..., description="Student's username (NPM).")
    email: str = Field(..., description="Student's email address.")

    model_config = ConfigDict(from_attributes=True)

class EnrollResponse(BaseModel):
    message: str = Field(..., description="Summary of the enrollment outcome.", examples=["Enrollment successful"])
    matched: int = Field(..., description="Number of provided usernames that matched an active praktikan account.")
    enrolled: int = Field(..., description="Number of students newly enrolled in the course.")
    skipped_duplicates: int = Field(..., description="Number of students who were already enrolled and thus skipped.")
    unmatched_usernames: list[str] = Field(
        default_factory=list, description="Usernames that matched no existing account."
    )
    skipped_invalid: list[str] = Field(
        default_factory=list,
        description="Usernames that matched an account which is not an active praktikan and were not enrolled.",
    )

class StaffAssignRequest(BaseModel):
    usernames: list[str] = Field(
        ..., description="Usernames of asprak accounts to assign to this course.", examples=[["asprak1", "asprak2"]]
    )

class StaffAssignResponse(BaseModel):
    message: str = Field(..., description="Summary of the assignment outcome.")
    matched: int = Field(..., description="Number of provided usernames that matched an active asprak account.")
    added: int = Field(..., description="Number of new staff assignments created.")
    skipped_duplicates: int = Field(..., description="Assignments skipped because they already existed.")
    unmatched_usernames: list[str] = Field(
        default_factory=list, description="Usernames that matched no existing account."
    )

class StaffMemberResponse(BaseModel):
    id: uuid.UUID = Field(..., description="Unique user identifier.")
    username: str = Field(..., description="Staff member's username.")
    email: str = Field(..., description="Staff member's email address.")
    role: RoleEnum = Field(..., description="Staff member's role.")

    model_config = ConfigDict(from_attributes=True)