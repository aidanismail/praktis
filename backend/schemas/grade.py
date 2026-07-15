import uuid
from pydantic import BaseModel, ConfigDict, Field


class GradeUpdate(BaseModel):
    student_id: uuid.UUID = Field(..., description="Student whose score is being set.")
    score: float = Field(..., description="Score to record for this student in this session.", examples=[88.5])

class BulkGradeRequest(BaseModel):
    records: list[GradeUpdate] = Field(..., description="Batch of per-student scores to upsert for a session.")

class GradeResponse(BaseModel):
    id: uuid.UUID = Field(..., description="Unique grade record identifier.")
    session_id: uuid.UUID = Field(..., description="Class session this grade belongs to.")
    student_id: uuid.UUID = Field(..., description="Student this grade belongs to.")
    score: float = Field(..., description="Recorded score.", examples=[88.5])

    model_config = ConfigDict(from_attributes=True)