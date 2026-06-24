import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from core.database import get_db
from models.user import User, RoleEnum
from models.module import Module
from api.dependencies import get_current_user, RoleChecker
from services.storage_service import storage_service

router = APIRouter(prefix="/modules", tags=["Modules"])

require_role = RoleChecker([RoleEnum.SUPERADMIN, RoleEnum.ASPRAK])

class ModuleCreate(BaseModel):
    title: str
    description: str | None = None
    file_extension: str

class ModuleConfirm(BaseModel):
    title: str
    description: str | None = None
    file_key: str

@router.post("/presigned-url")
async def get_presigned_upload_url(
    data: ModuleCreate,
    current_user: User = Depends(require_role)
):
    """Step 1: Asprak requests a URL to upload a file."""
    if data.file_extension.lower() not in [".pdf", ".docx"]:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed.")
    
    unique_filename = f"{uuid.uuid4().hex}{data.file_extension}"
    upload_url = storage_service.generate_presigned_upload_url(unique_filename)
    
    return {
        "upload_url": upload_url,
        "file_key": unique_filename
    }

@router.post("/confirm")
async def confirm_module_upload(
    data: ModuleConfirm,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role)
):
    new_module = Module(
        title=data.title,
        description=data.description,
        file_key=data.file_key,
        uploaded_by=current_user.id
    )
    db.add(new_module)
    await db.commit()
    return {"message": "Module successfully saved", "id": new_module.id}

@router.get("/")
async def list_modules(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Module).order_by(Module.created_at.desc()))
    modules = result.scalars().all()
    
    response = []
    for mod in modules:
        response.append({
            "id": mod.id,
            "title": mod.title,
            "description": mod.description,
            "download_url": storage_service.generate_presigned_download_url(mod.file_key),
            "created_at": mod.created_at
        })
    return response