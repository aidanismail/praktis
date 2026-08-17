import json
import re
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.database import get_db
from core.config import settings
from core.cache import cache_get, cache_set, cache_delete_pattern
from models.user import User, RoleEnum
from models.module import Module
from models.course_staff import CourseStaff
from models.enrollment import Enrollment
from api.dependencies import get_current_active_user
from api.permissions import require_course_access
from services.storage_service import storage_service
from schemas.common import MessageResponse
from schemas.module import (
    ModuleCreate,
    ModuleConfirm,
    PresignedUploadResponse,
    ModuleConfirmResponse,
    ModuleResponse,
    ModuleUpdate,
    ModuleReplaceConfirm
)

router = APIRouter(prefix="/modules", tags=["Modules"])

UNAUTHENTICATED_401 = {401: {"description": "Missing or invalid session cookie."}}
FORBIDDEN_403 = {403: {"description": "Caller isn't assigned to this course, has a read-only role, or a password change is pending."}}
MODULE_NOT_FOUND_404 = {404: {"description": "Module not found."}}

FILE_KEY_PATTERN = re.compile(r"^[0-9a-f]{32}\.(pdf|docx)$")


async def _get_module_or_404(db: AsyncSession, module_id: uuid.UUID) -> Module:
    result = await db.execute(select(Module).where(Module.id == module_id))
    mod = result.scalars().first()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
    return mod


@router.post(
    "/presigned-url",
    response_model=PresignedUploadResponse,
    summary="request a presigned upload URL",
    description=(
        "Superadmin, or an asprak assigned to the course. Generates a time-limited presigned "
        "MinIO/S3 PUT URL for a `.pdf` or `.docx` file."
    ),
    responses={
        **UNAUTHENTICATED_401,
        **FORBIDDEN_403,
        400: {"description": "Extension is not .pdf or .docx."},
        404: {"description": "Course not found."},
    },
)
async def get_presigned_upload_url(
    data: ModuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, data.course_id, write=True)

    if data.file_extension.lower() not in [".pdf", ".docx"]:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed.")

    unique_filename = f"{uuid.uuid4().hex}{data.file_extension.lower()}"
    upload_url = storage_service.generate_presigned_upload_url(unique_filename)

    intent = {
        "course_id": str(data.course_id),
        "user_id": str(current_user.id),
        "extension": data.file_extension.lower(),
        "type": "create"
    }
    await cache_set(f"intent:{unique_filename}", json.dumps(intent), ttl=3600)

    return {
        "upload_url": upload_url,
        "file_key": unique_filename
    }

@router.post(
    "/confirm",
    response_model=ModuleConfirmResponse,
    summary="confirm an upload and save the module record",
    description=(
        "Superadmin, or an asprak assigned to the course."
    ),
    responses={
        **UNAUTHENTICATED_401,
        **FORBIDDEN_403,
        400: {"description": "The file was never uploaded, invalid signature, or exceeds size limit."},
        404: {"description": "Course not found."},
        422: {"description": "file_key does not match format."},
    },
)
async def confirm_module_upload(
    data: ModuleConfirm,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, data.course_id, write=True)

    if not FILE_KEY_PATTERN.match(data.file_key):
        raise HTTPException(status_code=422, detail="Invalid file_key format")

    intent_json = await cache_get(f"intent:{data.file_key}")
    if not intent_json:
        raise HTTPException(status_code=400, detail="Upload intent expired or invalid.")
    intent = json.loads(intent_json)
    if intent.get("type") != "create" or intent["course_id"] != str(data.course_id) or intent["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Upload intent mismatch.")

    head = await storage_service.head_object(data.file_key)
    if head is None:
        raise HTTPException(status_code=400, detail="File was not uploaded; PUT the file to the presigned URL first")

    if head.get("ContentLength", 0) > settings.MODULE_MAX_UPLOAD_BYTES:
        await storage_service.delete_object(data.file_key)
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds the {settings.MODULE_MAX_UPLOAD_BYTES // (1024 * 1024)}MB size limit",
        )

    extension = intent["extension"]
    bytes_head = await storage_service.get_object_bytes(data.file_key, byte_range="bytes=0-10")
    if not bytes_head:
        raise HTTPException(status_code=400, detail="File was not uploaded")
    
    is_valid_magic = False
    if extension == ".pdf" and bytes_head.startswith(b"%PDF-"):
        is_valid_magic = True
    elif extension == ".docx" and bytes_head.startswith(b"PK\x03\x04"):
        is_valid_magic = True

    if not is_valid_magic:
        await storage_service.delete_object(data.file_key)
        raise HTTPException(status_code=400, detail="Invalid file signature (not a real PDF/DOCX).")

    new_module = Module(
        title=data.title,
        description=data.description,
        file_key=data.file_key,
        course_id=data.course_id,
        uploaded_by=current_user.id,
        is_published=False
    )
    db.add(new_module)
    await db.commit()
    await cache_delete_pattern("cache:modules:*")
    return {"message": "Module successfully saved", "id": new_module.id}

@router.get(
    "/",
    response_model=list[ModuleResponse],
    summary="List modules",
    description="Returns modules with a fresh presigned download URL for each.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, 404: {"description": "Course not found."}},
)
@router.get("", include_in_schema=False)
async def list_modules(
    course_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if course_id is not None:
        await require_course_access(db, current_user, course_id, write=False)

    cache_key = f"cache:modules:list:{course_id}:{current_user.role.value}:{current_user.id}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return json.loads(cached)

    query = select(Module)

    if current_user.role == RoleEnum.PRAKTIKAN:
        query = query.join(
            Enrollment, Enrollment.course_id == Module.course_id
        ).where(Enrollment.student_id == current_user.id, Module.is_published == True)
    elif current_user.role == RoleEnum.ASPRAK:
        query = query.join(
            CourseStaff, CourseStaff.course_id == Module.course_id
        ).where(CourseStaff.user_id == current_user.id)

    if course_id is not None:
        query = query.where(Module.course_id == course_id)

    result = await db.execute(query.order_by(Module.created_at.desc()))
    modules = result.scalars().all()

    response = []
    for mod in modules:
        response.append({
            "id": str(mod.id),
            "title": mod.title,
            "description": mod.description,
            "download_url": storage_service.generate_presigned_download_url(mod.file_key),
            "is_published": mod.is_published,
            "created_at": mod.created_at.isoformat(),
            "course_id": str(mod.course_id) if mod.course_id else None,
            "file_key": mod.file_key,
        })

    await cache_set(cache_key, json.dumps(response), ttl=30)
    return response


@router.put(
    "/{module_id}",
    response_model=MessageResponse,
    summary="Update module metadata",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **MODULE_NOT_FOUND_404},
)
async def update_module(
    module_id: uuid.UUID,
    data: ModuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    mod = await _get_module_or_404(db, module_id)
    await require_course_access(db, current_user, mod.course_id, write=True)

    if data.title is not None:
        mod.title = data.title
    if data.description is not None:
        mod.description = data.description

    await db.commit()
    await cache_delete_pattern("cache:modules:*")
    return {"message": "Module updated successfully."}


@router.post(
    "/{module_id}/publish",
    response_model=MessageResponse,
    summary="Publish module",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **MODULE_NOT_FOUND_404},
)
async def publish_module(
    module_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    mod = await _get_module_or_404(db, module_id)
    await require_course_access(db, current_user, mod.course_id, write=True)

    mod.is_published = True
    await db.commit()
    await cache_delete_pattern("cache:modules:*")
    return {"message": "Module published successfully."}


@router.post(
    "/{module_id}/unpublish",
    response_model=MessageResponse,
    summary="Unpublish module",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **MODULE_NOT_FOUND_404},
)
async def unpublish_module(
    module_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    mod = await _get_module_or_404(db, module_id)
    await require_course_access(db, current_user, mod.course_id, write=True)

    mod.is_published = False
    await db.commit()
    await cache_delete_pattern("cache:modules:*")
    return {"message": "Module unpublished successfully."}


@router.delete(
    "/{module_id}",
    response_model=MessageResponse,
    summary="Delete module",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **MODULE_NOT_FOUND_404},
)
async def delete_module(
    module_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    mod = await _get_module_or_404(db, module_id)
    await require_course_access(db, current_user, mod.course_id, write=True)

    file_key = mod.file_key
    await db.delete(mod)
    await db.commit()
    await storage_service.delete_object(file_key)
    await cache_delete_pattern("cache:modules:*")
    return {"message": "Module deleted successfully."}


@router.post(
    "/{module_id}/presigned-replacement-url",
    response_model=PresignedUploadResponse,
    summary="Step 1 of replacement: get upload URL",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **MODULE_NOT_FOUND_404},
)
async def presigned_replacement_url(
    module_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    mod = await _get_module_or_404(db, module_id)
    await require_course_access(db, current_user, mod.course_id, write=True)

    file_extension = ".pdf" if mod.file_key.endswith(".pdf") else ".docx"
    unique_filename = f"{uuid.uuid4().hex}{file_extension}"
    upload_url = storage_service.generate_presigned_upload_url(unique_filename)

    intent = {
        "module_id": str(mod.id),
        "course_id": str(mod.course_id),
        "user_id": str(current_user.id),
        "extension": file_extension,
        "type": "replace"
    }
    await cache_set(f"intent:{unique_filename}", json.dumps(intent), ttl=3600)

    return {
        "upload_url": upload_url,
        "file_key": unique_filename
    }


@router.post(
    "/{module_id}/confirm-replacement",
    response_model=MessageResponse,
    summary="Step 2 of replacement: confirm replacement upload",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **MODULE_NOT_FOUND_404},
)
async def confirm_replacement(
    module_id: uuid.UUID,
    data: ModuleReplaceConfirm,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    mod = await _get_module_or_404(db, module_id)
    await require_course_access(db, current_user, mod.course_id, write=True)

    if not FILE_KEY_PATTERN.match(data.file_key):
        raise HTTPException(status_code=422, detail="Invalid file_key format")

    intent_json = await cache_get(f"intent:{data.file_key}")
    if not intent_json:
        raise HTTPException(status_code=400, detail="Upload intent expired or invalid.")
    intent = json.loads(intent_json)
    if (intent.get("type") != "replace" or 
        intent["module_id"] != str(mod.id) or 
        intent["course_id"] != str(mod.course_id) or 
        intent["user_id"] != str(current_user.id)):
        raise HTTPException(status_code=403, detail="Upload intent mismatch.")

    head = await storage_service.head_object(data.file_key)
    if head is None:
        raise HTTPException(status_code=400, detail="File was not uploaded")

    if head.get("ContentLength", 0) > settings.MODULE_MAX_UPLOAD_BYTES:
        await storage_service.delete_object(data.file_key)
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds the {settings.MODULE_MAX_UPLOAD_BYTES // (1024 * 1024)}MB size limit",
        )

    extension = intent["extension"]
    bytes_head = await storage_service.get_object_bytes(data.file_key, byte_range="bytes=0-10")
    if not bytes_head:
        raise HTTPException(status_code=400, detail="File was not uploaded")
    
    is_valid_magic = False
    if extension == ".pdf" and bytes_head.startswith(b"%PDF-"):
        is_valid_magic = True
    elif extension == ".docx" and bytes_head.startswith(b"PK\x03\x04"):
        is_valid_magic = True

    if not is_valid_magic:
        await storage_service.delete_object(data.file_key)
        raise HTTPException(status_code=400, detail="Invalid file signature.")

    old_file_key = mod.file_key
    mod.file_key = data.file_key
    mod.uploaded_by = current_user.id
    
    await db.commit()
    await storage_service.delete_object(old_file_key)
    await cache_delete_pattern("cache:modules:*")

    return {"message": "Module successfully replaced."}
