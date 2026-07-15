import uuid
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from models.user import RoleEnum


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="User's email address.", examples=["student1@unpad.ac.id"])
    username: str = Field(..., description="Login username. For students this is their NPM.", examples=["140810220001"])
    role: RoleEnum = Field(..., description="Role determining what the user can access.")

class UserCreate(UserBase):
    password: str = Field(..., description="Plaintext password (hashed before storage).", examples=["aidanbagas123"])

class UserResponse(UserBase):
    id: uuid.UUID = Field(..., description="Unique user identifier.")
    is_active: bool = Field(..., description="Whether the account can currently log in.")
    force_password_change: bool = Field(
        ..., description="If true, the user must call /auth/change-password before using any other endpoint."
    )

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str = Field(..., description="Signed JWT access token.")
    token_type: str = Field(..., description="Token scheme, always 'bearer'.", examples=["bearer"])

class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="The user's current password.")
    new_password: str = Field(..., description="New password to set. Must differ from the old password.")

class LoginRequest(BaseModel):
    username: str = Field(..., description="Login username (NPM for students).", examples=["140810220001"])
    password: str = Field(..., description="Account password.")

class ImportCsvResponse(BaseModel):
    message: str = Field(..., description="Summary of the import outcome.", examples=["Import successful"])
    total_processed: int = Field(..., description="Number of valid rows parsed from the CSV.")
    total_inserted: int = Field(..., description="Number of new student accounts actually created.")
    skipped_duplicates: int = Field(..., description="Rows skipped because the username (NPM) already existed.")