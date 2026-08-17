import uuid
import datetime
from pydantic import BaseModel, Field


class AssignmentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Assignment title.")
    description: str | None = Field(None, description="Detailed instructions.")
    session_id: uuid.UUID | None = Field(None, description="Optional class session ID.")
    due_date: datetime.datetime | None = Field(None, description="Due date for submissions.")
    max_points: int = Field(100, ge=1, le=1000, description="Maximum points possible.")
    allowed_file_types: str = Field("pdf,zip,docx", description="Comma-separated allowed extensions.")
    is_published: bool = Field(True, description="Whether assignment is published to students.")


class AssignmentUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255, description="Assignment title.")
    description: str | None = Field(None, description="Detailed instructions.")
    due_date: datetime.datetime | None = Field(None, description="Due date for submissions.")
    max_points: int | None = Field(None, ge=1, le=1000, description="Maximum points possible.")
    allowed_file_types: str | None = Field(None, description="Allowed file extensions.")
    is_published: bool | None = Field(None, description="Publish status.")


class SubmissionResponse(BaseModel):
    id: str = Field(..., description="Submission ID.")
    assignment_id: str = Field(..., description="Assignment ID.")
    student_id: str = Field(..., description="Student User ID.")
    student_username: str = Field(..., description="Student username.")
    student_email: str | None = Field(None, description="Student email.")
    file_name: str = Field(..., description="Uploaded file name.")
    file_size: int = Field(..., description="File size in bytes.")
    download_url: str = Field(..., description="Presigned download URL.")
    submitted_at: str = Field(..., description="Submission timestamp.")
    is_late: bool = Field(..., description="Whether submitted after due date.")
    score: float | None = Field(None, description="Numeric grade score.")
    feedback: str | None = Field(None, description="Grader feedback notes.")
    graded_by: str | None = Field(None, description="User ID of grader.")
    graded_at: str | None = Field(None, description="Grading timestamp.")
    status: str = Field(..., description="Submission status (submitted/graded/returned).")


class GradeSubmissionRequest(BaseModel):
    score: float = Field(..., ge=0, description="Score awarded to student.")
    feedback: str | None = Field(None, description="Feedback comment for student.")


class AssignmentResponse(BaseModel):
    id: str = Field(..., description="Assignment ID.")
    course_id: str = Field(..., description="Course ID.")
    session_id: str | None = Field(None, description="Class session ID.")
    title: str = Field(..., description="Assignment title.")
    description: str | None = Field(None, description="Detailed instructions.")
    due_date: str | None = Field(None, description="Due date timestamp.")
    max_points: int = Field(..., description="Max points.")
    allowed_file_types: str = Field(..., description="Allowed file types.")
    is_published: bool = Field(..., description="Publish status.")
    created_at: str = Field(..., description="Creation timestamp.")
    submissions_count: int = Field(0, description="Total submissions count.")
    my_submission: SubmissionResponse | None = Field(None, description="Current user's submission if Praktikan.")
