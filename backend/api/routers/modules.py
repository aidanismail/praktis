import json
import re
import uuid
from fastapi import APIRouter, Depends, HTTPException
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
from schemas.module import (
    ModuleCreate,
    ModuleConfirm,
    PresignedUploadResponse,
    ModuleConfirmResponse,
    ModuleResponse,
)

router = APIRouter(prefix="/modules", tags=["Modules"])

UNAUTHENTICATED_401 = {401: {"description": "Missing or invalid session cookie."}}
FORBIDDEN_403 = {403: {"description": "Caller isn't assigned to this course, has a read-only role, or a password change is pending."}}

FILE_KEY_PATTERN = re.compile(r"^[0-9a-f]{32}\.(pdf|docx)$")


@router.post(
    "/presigned-url",
    response_model=PresignedUploadResponse,
    summary="Step 1: request a presigned upload URL",
    description=(
        "Superadmin, or an asprak assigned to the course. Generates a time-limited presigned "
        "MinIO/S3 PUT URL for a `.pdf` or `.docx` file. The client uploads the file bytes "
        "directly to that URL (bypassing this API), then calls `POST /modules/confirm` with "
        "the returned `file_key` to persist the module record."
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

    return {
        "upload_url": upload_url,
        "file_key": unique_filename
    }

@router.post(
    "/confirm",
    response_model=ModuleConfirmResponse,
    summary="Step 2: confirm an upload and save the module record",
    description=(
        "Superadmin, or an asprak assigned to the course. Call this after the file has been "
        "PUT to the presigned URL from `/modules/presigned-url`. Verifies the object was "
        "actually uploaded and within the size limit, then persists the module metadata and "
        "invalidates the cached module listings."
    ),
    responses={
        **UNAUTHENTICATED_401,
        **FORBIDDEN_403,
        400: {"description": "The file was never uploaded, or exceeds the size limit."},
        404: {"description": "Course not found."},
        422: {"description": "file_key does not match the format issued by the presigned-url step."},
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

    head = await storage_service.head_object(data.file_key)
    if head is None:
        raise HTTPException(status_code=400, detail="File was not uploaded; PUT the file to the presigned URL first")

    if head.get("ContentLength", 0) > settings.MODULE_MAX_UPLOAD_BYTES:
        await storage_service.delete_object(data.file_key)
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds the {settings.MODULE_MAX_UPLOAD_BYTES // (1024 * 1024)}MB size limit",
        )

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
        "filter to one course — the caller must have access to that course (enrolled "
        "praktikan, assigned asprak, or superadmin). If omitted, results are scoped to the "
        "caller: praktikan see their enrolled courses' modules, asprak see their assigned "
        "courses' modules, and superadmin sees everything. Results are cached for ~30s per "
        "(course, role, user) combination."
    ),
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, 404: {"description": "Course not found."}},
)
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
        ).where(Enrollment.student_id == current_user.id)
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
            "created_at": mod.created_at.isoformat()
        })

    await cache_set(cache_key, json.dumps(response), ttl=30)
    return response
