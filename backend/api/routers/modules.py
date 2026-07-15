import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.database import get_db
from core.cache import cache_get, cache_set, cache_delete_pattern
from models.user import User, RoleEnum
from models.module import Module
from models.enrollment import Enrollment
from api.dependencies import get_current_active_user, RoleChecker
from services.storage_service import storage_service
from schemas.module import (
    ModuleCreate,
    ModuleConfirm,
    PresignedUploadResponse,
    ModuleConfirmResponse,
    ModuleResponse,
)

router = APIRouter(prefix="/modules", tags=["Modules"])

require_role = RoleChecker([RoleEnum.SUPERADMIN, RoleEnum.ASPRAK])

UNAUTHENTICATED_401 = {401: {"description": "Missing or invalid session cookie."}}
STAFF_ONLY_403 = {403: {"description": "Requires superadmin/asprak role, or a pending password change."}}


@router.post(
    "/presigned-url",
    response_model=PresignedUploadResponse,
    summary="Step 1: request a presigned upload URL",
    description=(
        "Superadmin/asprak only. Generates a time-limited presigned MinIO/S3 PUT URL for a "
        "`.pdf` or `.docx` file. The client uploads the file bytes directly to that URL "
        "(bypassing this API), then calls `POST /modules/confirm` with the returned `file_key` "
        "to persist the module record."
    ),
    responses={**UNAUTHENTICATED_401, **STAFF_ONLY_403, 400: {"description": "Extension is not .pdf or .docx."}},
)
async def get_presigned_upload_url(
    data: ModuleCreate,
    current_user: User = Depends(require_role)
):
    if data.file_extension.lower() not in [".pdf", ".docx"]:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed.")

    unique_filename = f"{uuid.uuid4().hex}{data.file_extension}"
    upload_url = storage_service.generate_presigned_upload_url(unique_filename)

    return {
        "upload_url": upload_url,
        "file_key": unique_filename
    }

@router.post(
    "/confirm",
    response_model=ModuleConfirmResponse,
    summary="Step 2: confirm an upload and save the module record",
    description=(
        "Superadmin/asprak only. Call this after the file has been PUT to the presigned URL "
        "from `/modules/presigned-url`. Persists the module metadata and invalidates the "
        "cached module listings."
    ),
    responses={**UNAUTHENTICATED_401, **STAFF_ONLY_403},
)
async def confirm_module_upload(
    data: ModuleConfirm,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role)
):
    new_module = Module(
        title=data.title,
        description=data.description,
        file_key=data.file_key,
        course_id=data.course_id,
        uploaded_by=current_user.id
    )
    db.add(new_module)
    await db.commit()
    await cache_delete_pattern("cache:modules:*")
    return {"message": "Module successfully saved", "id": new_module.id}

@router.get(
    "/",
    response_model=list[ModuleResponse],
    summary="List modules",
    description=(
        "Returns modules with a fresh presigned download URL for each. Pass `course_id` to "
        "filter explicitly; if omitted, a `praktikan` only sees modules for courses they're "
        "enrolled in, while staff roles see everything. Results are cached for ~30s per "
        "(course, role, user) combination."
    ),
    responses=UNAUTHENTICATED_401,  # type: ignore
)
async def list_modules(
    course_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    cache_key = f"cache:modules:list:{course_id}:{current_user.role.value}:{current_user.id}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return json.loads(cached)

    query = select(Module)

    if course_id is not None:
        query = query.where(Module.course_id == course_id)
    elif current_user.role == RoleEnum.PRAKTIKAN:
        query = query.join(
            Enrollment, Enrollment.course_id == Module.course_id
        ).where(Enrollment.student_id == current_user.id)

    result = await db.execute(query.order_by(Module.created_at.desc()))
    modules = result.scalars().all()

    response = []
    for mod in modules:
        response.append({
            "id": str(mod.id),
            "title": mod.title,
            "description": mod.description,
            "download_url": storage_service.generate_presigned_download_url(mod.file_key),
            "created_at": mod.created_at.isoformat()
        })

    await cache_set(cache_key, json.dumps(response), ttl=30)
    return response
