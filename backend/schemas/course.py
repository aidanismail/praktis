import uuid
from datetime import date as date_type
from pydantic import BaseModel, ConfigDict, Field
from models.user import RoleEnum


class CourseCreate(BaseModel):
    code: str = Field(..., description="Unique course code.", examples=["IF101"])
    name: str = Field(..., description="Human-readable course name.", examples=["Praktikum Pemrograman"])

class CourseResponse(BaseModel):
    id: uuid.UUID = Field(..., description="Unique course identifier.")
    code: str = Field(..., description="Unique course code.", examples=["IF101"])
    name: str = Field(..., description="Human-readable course name.", examples=["Praktikum Pemrograman"])

    model_config = ConfigDict(from_attributes=True)

class EnrollRequest(BaseModel):
    usernames: list[str] = Field(
        ..., description="Usernames (NPMs) of students to enroll in this course.", examples=[["140810220001", "140810220002"]]
    )

class ClassSessionCreate(BaseModel):
    title: str = Field(..., description="Title of the session/meeting.", examples=["Pertemuan 1: Pengenalan"])
    date: date_type = Field(..., description="Date the session takes place.")

class ClassSessionResponse(BaseModel):
    id: uuid.UUID = Field(..., description="Unique session identifier.")
    course_id: uuid.UUID = Field(..., description="Course this session belongs to.")
    title: str = Field(..., description="Title of the session/meeting.")
    date: date_type = Field(..., description="Date the session takes place.")

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