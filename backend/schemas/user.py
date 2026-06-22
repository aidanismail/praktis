import uuid
from pydantic import BaseModel, EmailStr, ConfigDict
from models.user import RoleEnum

class UserBase(BaseModel):
    email: EmailStr
    username: str
    role: RoleEnum

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: uuid.UUID
    is_active: bool
    force_password_change: bool

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str