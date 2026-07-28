import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class GradeUpdate(BaseModel):
    student_id: uuid.UUID = Field(..., description="Student whose score is being set.")
    score: float = Field(
        ...,
        ge=0,
        le=100,
        allow_inf_nan=False,
        description="Score to record for this student in this session (0-100).",
        examples=[88.5],
    )

class BulkGradeRequest(BaseModel):
    records: list[GradeUpdate] = Field(..., description="Batch of per-student scores to upsert for a session.")

class GradeResponse(BaseModel):
    id: uuid.UUID = Field(..., description="Unique grade record identifier.")
    session_id: uuid.UUID = Field(..., description="Class session this grade belongs to.")
    student_id: uuid.UUID = Field(..., description="Student this grade belongs to.")
    score: float = Field(..., description="Recorded score.", examples=[88.5])
    created_at: datetime = Field(..., description="When this record was first created.")
    updated_at: datetime = Field(..., description="When this record was last changed.")
    recorded_by: uuid.UUID | None = Field(None, description="User who last recorded this score.")

    model_config = ConfigDict(from_attributes=True)