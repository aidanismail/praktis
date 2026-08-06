import uuid
from pydantic import BaseModel, Field


class ModuleCreate(BaseModel):
    title: str = Field(..., description="Display title of the module.", examples=["Modul 1: Pengenalan Python"])
    description: str | None = Field(None, description="Optional longer description of the module contents.")
    file_extension: str = Field(..., description="Extension of the file to upload; only .pdf and .docx are allowed.", examples=[".pdf"])
    course_id: uuid.UUID = Field(..., description="Course this module belongs to.")

class ModuleConfirm(BaseModel):
    title: str = Field(..., description="Display title of the module.", examples=["Modul 1: Pengenalan Python"])
    description: str | None = Field(None, description="Optional longer description of the module contents.")
    file_key: str = Field(..., description="The file_key returned by the presigned-url step, after the file was uploaded to it.")
    course_id: uuid.UUID = Field(..., description="Course this module belongs to.")

class PresignedUploadResponse(BaseModel):
    upload_url: str = Field(..., description="Presigned MinIO/S3 URL the client should PUT the file bytes to directly.")
    file_key: str = Field(..., description="Object key to pass back to /modules/confirm after uploading.")

class ModuleConfirmResponse(BaseModel):
    message: str = Field(..., description="Confirmation message.", examples=["Module successfully saved"])
    id: uuid.UUID = Field(..., description="ID of the newly created module record.")

class ModuleUpdate(BaseModel):
    title: str | None = Field(None, description="New title of the module.")
    description: str | None = Field(None, description="New description of the module.")

class ModuleReplaceConfirm(BaseModel):
    file_key: str = Field(..., description="The file_key returned by the presigned-url step for replacement.")

class ModuleResponse(BaseModel):
    id: str = Field(..., description="Unique module identifier.")
    title: str = Field(..., description="Display title of the module.")
    description: str | None = Field(None, description="Optional longer description of the module contents.")
    download_url: str = Field(..., description="Presigned, time-limited URL to download the file directly from storage.")
    is_published: bool = Field(..., description="Whether this module is visible to Praktikan.")
    created_at: str = Field(..., description="ISO-8601 timestamp of when the module was uploaded.")