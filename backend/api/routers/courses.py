import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy import CursorResult, delete

from core.database import get_db
from core.cache import cache_get, cache_set, cache_delete_pattern
from models.user import User, RoleEnum
from models.course import Course
from models.class_session import ClassSession
from models.course_staff import CourseStaff
from models.enrollment import Enrollment
from api.dependencies import get_current_active_user, RoleChecker
from api.permissions import require_course_access
from services.storage_service import storage_service
from schemas.common import MessageResponse
from schemas.course import (
    CourseCreate,
    CourseUpdate,
    CourseBannerUpdate,
    CourseResponse,
    EnrollRequest,
    EnrollResponse,
    ClassSessionCreate,
    ClassSessionResponse,
    EnrolledStudentResponse,
    StaffAssignRequest,
    StaffAssignResponse,
    StaffMemberResponse,
)

router = APIRouter(prefix="/courses", tags=["Courses"])

require_superadmin = RoleChecker([RoleEnum.SUPERADMIN])

UNAUTHENTICATED_401 = {401: {"description": "Missing or invalid session cookie."}}
FORBIDDEN_403 = {403: {"description": "Caller's role isn't permitted here, isn't assigned to this course, or a password change is still pending."}}
COURSE_NOT_FOUND_404 = {404: {"description": "No course exists with the given course_id."}}


@router.post(
    "/",
    response_model=CourseResponse,
    summary="Create a course",
    description="Superadmin only. The combination of `code`, `academic_year`, and `semester` must be unique.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, 409: {"description": "This course offering already exists."}},
)
async def create_course(
    data: CourseCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_superadmin),
):
    existing = await db.execute(
        select(Course).where(
            Course.code == data.code,
            Course.academic_year == data.academic_year,
            Course.semester == data.semester
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This course offering already exists")

    course = Course(
        code=data.code,
        name=data.name,
        academic_year=data.academic_year,
        semester=data.semester,
        is_active=data.is_active,
        banner_theme_id=data.banner_theme_id,
        banner_pattern_id=data.banner_pattern_id,
        banner_image_url=data.banner_image_url,
    )
    db.add(course)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This course offering already exists")
    await db.refresh(course)
    await cache_delete_pattern("cache:courses:*")
    return course


@router.put(
    "/{course_id}",
    response_model=CourseResponse,
    summary="Update a course offering",
    description="Superadmin only. Update code, name, academic year, semester, or active status.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **COURSE_NOT_FOUND_404},
)
async def update_course(
    course_id: uuid.UUID,
    data: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_superadmin),
):
    course = await _get_course_or_404(db, course_id)

    if data.code is not None:
        course.code = data.code
    if data.name is not None:
        course.name = data.name
    if data.academic_year is not None:
        course.academic_year = data.academic_year
    if data.semester is not None:
        course.semester = data.semester
    if data.is_active is not None:
        course.is_active = data.is_active
    if data.banner_theme_id is not None:
        course.banner_theme_id = data.banner_theme_id
    if data.banner_pattern_id is not None:
        course.banner_pattern_id = data.banner_pattern_id
    if data.banner_image_url is not None:
        course.banner_image_url = data.banner_image_url

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="A course offering with these details already exists")

    await db.refresh(course)
    await cache_delete_pattern("cache:courses:*")
    return course


@router.patch(
    "/{course_id}/banner",
    response_model=CourseResponse,
    summary="Update course banner styling",
    description="Superadmin, or an asprak assigned to this course.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **COURSE_NOT_FOUND_404},
)
async def update_course_banner(
    course_id: uuid.UUID,
    data: CourseBannerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    course = await require_course_access(db, current_user, course_id, write=True)

    if data.banner_theme_id is not None:
        course.banner_theme_id = data.banner_theme_id
    if data.banner_pattern_id is not None:
        course.banner_pattern_id = data.banner_pattern_id
    if data.banner_image_url is not None:
        course.banner_image_url = data.banner_image_url

    await db.commit()
    await db.refresh(course)
    await cache_delete_pattern("cache:courses:*")
    return course


@router.post(
    "/{course_id}/banner-image",
    response_model=CourseResponse,
    summary="Upload custom course banner image",
    description="Superadmin, or an asprak assigned to this course. Max 5MB, JPG/PNG/WebP.",
    responses={
        **UNAUTHENTICATED_401,
        **FORBIDDEN_403,
        **COURSE_NOT_FOUND_404,
        400: {"description": "Invalid image format or size exceeds 5MB."},
    },
)
async def upload_course_banner_image(
    course_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    course = await require_course_access(db, current_user, course_id, write=True)

    allowed_types = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }
    content_type = file.content_type or ""
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WebP images are allowed for course banners.",
        )

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Banner image must be 5MB or smaller.")

    ext = allowed_types[content_type]
    object_name = f"banners/{course_id}/{uuid.uuid4().hex}{ext}"

    await asyncio.to_thread(
        storage_service.internal.put_object,
        Bucket=storage_service.bucket_name,
        Key=object_name,
        Body=contents,
        ContentType=content_type,
    )

    course.banner_image_url = f"/api/courses/{course_id}/banner-image"
    await db.commit()
    await db.refresh(course)
    await cache_delete_pattern("cache:courses:*")
    return course


@router.get(
    "/{course_id}/banner-image",
    summary="Get course banner image",
    description="Streams course banner image. Accessible by enrolled students, assigned staff, and superadmins.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **COURSE_NOT_FOUND_404},
)
async def get_course_banner_image(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    course = await require_course_access(db, current_user, course_id, write=False)
    if not course.banner_image_url:
        raise HTTPException(status_code=404, detail="Course has no custom banner image")

    prefix = f"banners/{course_id}/"

    def _list_banner_objects():
        return storage_service.internal.list_objects_v2(
            Bucket=storage_service.bucket_name,
            Prefix=prefix,
        )

    resp = await asyncio.to_thread(_list_banner_objects)
    contents = resp.get("Contents", [])
    if not contents:
        raise HTTPException(status_code=404, detail="Banner image not found in storage")

    latest_key = sorted(contents, key=lambda x: x["LastModified"], reverse=True)[0]["Key"]

    def _fetch_banner_object():
        return storage_service.internal.get_object(
            Bucket=storage_service.bucket_name,
            Key=latest_key,
        )

    obj = await asyncio.to_thread(_fetch_banner_object)
    data = obj["Body"].read()
    content_type = obj.get("ContentType", "image/jpeg")

    return Response(
        content=data,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600"
        },
    )


@router.delete(
    "/{course_id}/banner-image",
    response_model=CourseResponse,
    summary="Delete course custom banner image",
    description="Superadmin, or an asprak assigned to this course.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **COURSE_NOT_FOUND_404},
)
async def delete_course_banner_image(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    course = await require_course_access(db, current_user, course_id, write=True)

    prefix = f"banners/{course_id}/"

    def _delete_all_banners():
        resp = storage_service.internal.list_objects_v2(
            Bucket=storage_service.bucket_name,
            Prefix=prefix,
        )
        for item in resp.get("Contents", []):
            storage_service.internal.delete_object(
                Bucket=storage_service.bucket_name,
                Key=item["Key"],
            )

    await asyncio.to_thread(_delete_all_banners)

    course.banner_image_url = None
    await db.commit()
    await db.refresh(course)
    await cache_delete_pattern("cache:courses:*")
    return course


@router.delete(
    "/{course_id}",
    response_model=MessageResponse,
    summary="Delete a course offering",
    description="Superadmin only. Removes a course and all associated registrations.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **COURSE_NOT_FOUND_404},
)
async def delete_course(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_superadmin),
):
    course = await _get_course_or_404(db, course_id)

    # Clean up banner files in storage
    prefix = f"banners/{course_id}/"

    def _cleanup_banners():
        try:
            resp = storage_service.internal.list_objects_v2(
                Bucket=storage_service.bucket_name,
                Prefix=prefix,
            )
            for item in resp.get("Contents", []):
                storage_service.internal.delete_object(
                    Bucket=storage_service.bucket_name,
                    Key=item["Key"],
                )
        except Exception:
            pass

    await asyncio.to_thread(_cleanup_banners)

    await db.delete(course)
    await db.commit()
    await cache_delete_pattern("cache:courses:*")
    return {"message": f"Successfully deleted course '{course.code}'"}




@router.get(
    "/",
    response_model=list[CourseResponse],
    summary="List courses",
    description=(
        "A `praktikan` sees courses they're enrolled in, an `asprak` sees "
        "courses they're assigned to, and a `superadmin` sees all courses. "
        "Results are cached for ~30s per (role, user)."
    ),
    responses=UNAUTHENTICATED_401,  # type: ignore
)
async def list_courses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    cache_key = f"cache:courses:list:{current_user.role.value}:{current_user.id}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return json.loads(cached)

    if current_user.role == RoleEnum.PRAKTIKAN:
        result = await db.execute(
            select(Course)
            .join(Enrollment, Enrollment.course_id == Course.id)
            .where(Enrollment.student_id == current_user.id)
        )
    elif current_user.role == RoleEnum.ASPRAK:
        result = await db.execute(
            select(Course)
            .join(CourseStaff, CourseStaff.course_id == Course.id)
            .where(CourseStaff.user_id == current_user.id)
        )
    else:
        result = await db.execute(select(Course))
    courses = result.scalars().all()

    payload = [CourseResponse.model_validate(c).model_dump(mode="json") for c in courses]
    await cache_set(cache_key, json.dumps(payload), ttl=30)
    return payload


async def _get_course_or_404(db: AsyncSession, course_id: uuid.UUID) -> Course:
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.get(
    "/{course_id}",
    response_model=CourseResponse,
    summary="Get course detail by ID",
    description="Returns detailed information for a specific course offering. Requires course access (enrolled student, assigned staff, or superadmin).",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **COURSE_NOT_FOUND_404},
)
async def get_course_detail(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, course_id, write=False)
    course = await _get_course_or_404(db, course_id)
    return CourseResponse.model_validate(course)


@router.post(
    "/{course_id}/enroll",
    response_model=EnrollResponse,
    summary="Enroll students in a course",
    description=(
        "Superadmin only. `usernames` are matched against existing accounts (typically "
        "students' NPMs). Only active `praktikan` accounts are enrolled; usernames that "
        "match no account are reported in `unmatched_usernames`, and matches that are "
        "not active praktikan accounts are reported in `skipped_invalid`. Students "
        "already enrolled are skipped rather than duplicated."
    ),
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **COURSE_NOT_FOUND_404, 400: {"description": "None of the given usernames matched an enrollable student account."}},
)
async def enroll_students(
    course_id: uuid.UUID,
    data: EnrollRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_superadmin),
):
    await _get_course_or_404(db, course_id)

    if not data.usernames:
        return {
            "message": "No usernames provided",
            "matched": 0,
            "enrolled": 0,
            "skipped_duplicates": 0,
            "unmatched_usernames": [],
            "skipped_invalid": [],
        }

    result = await db.execute(select(User).where(User.username.in_(data.usernames)))
    matched_users = result.scalars().all()
    matched_names = {u.username for u in matched_users}
    unmatched = sorted(set(data.usernames) - matched_names)

    students = [u for u in matched_users if u.role == RoleEnum.PRAKTIKAN and u.is_active]
    skipped_invalid = sorted(u.username for u in matched_users if u not in students)

    if not students:
        raise HTTPException(
            status_code=400,
            detail="No matching active praktikan accounts found for provided usernames",
        )

    values = [{"id": uuid.uuid4(), "course_id": course_id, "student_id": u.id} for u in students]
    stmt = pg_insert(Enrollment).values(values)
    stmt = stmt.on_conflict_do_nothing(constraint="uix_course_student")
    result = await db.execute(stmt)
    assert isinstance(result, CursorResult)
    await db.commit()
    await cache_delete_pattern("cache:courses:*")

    return {
        "message": "Enrollment successful",
        "matched": len(students),
        "enrolled": result.rowcount,
        "skipped_duplicates": len(students) - result.rowcount,
        "unmatched_usernames": unmatched,
        "skipped_invalid": skipped_invalid,
    }


@router.post(
    "/{course_id}/sessions",
    response_model=ClassSessionResponse,
    summary="Create a class session",
    description=(
        "Superadmin, or an asprak assigned to this course. Represents one lab meeting "
        "(e.g. 'Pertemuan 1') that attendance and grades are recorded against."
    ),
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **COURSE_NOT_FOUND_404},
)
async def create_session(
    course_id: uuid.UUID,
    data: ClassSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, course_id, write=True)

    session = ClassSession(course_id=course_id, title=data.title, date=data.date)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get(
    "/{course_id}/sessions",
    summary="List a course's sessions",
    response_model=list[ClassSessionResponse],
    description=(
        "Requires access to the course: superadmin, assigned asprak, or an "
        "enrolled praktikan. Ordered by date."
    ),
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **COURSE_NOT_FOUND_404},
)
async def list_sessions(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, course_id, write=False)

    result = await db.execute(
        select(ClassSession).where(ClassSession.course_id == course_id).order_by(ClassSession.date)
    )
    return result.scalars().all()


@router.get(
    "/{course_id}/students",
    response_model=list[EnrolledStudentResponse],
    summary="List a course's enrolled students",
    description=(
        "Superadmin, or assigned asprak. Used by the attendance/grading UI to "
        "know which students to display. Cached for ~30s per course."
    ),
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **COURSE_NOT_FOUND_404},
)
async def list_students(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, course_id, write=False)
    if current_user.role == RoleEnum.PRAKTIKAN:
        raise HTTPException(status_code=403, detail="Students cannot view the course roster")

    cache_key = f"cache:courses:students:{course_id}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return json.loads(cached)

    result = await db.execute(
        select(User)
        .join(Enrollment, Enrollment.student_id == User.id)
        .where(Enrollment.course_id == course_id)
    )
    students = result.scalars().all()

    payload = [EnrolledStudentResponse.model_validate(s).model_dump(mode="json") for s in students]
    await cache_set(cache_key, json.dumps(payload), ttl=30)
    return payload


@router.get(
    "/{course_id}/staff",
    response_model=list[StaffMemberResponse],
    summary="List a course's assigned staff",
    description="Superadmin only. Returns the asprak accounts assigned to this course.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **COURSE_NOT_FOUND_404},
)
async def list_staff(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_superadmin),
):
    await _get_course_or_404(db, course_id)

    result = await db.execute(
        select(User)
        .join(CourseStaff, CourseStaff.user_id == User.id)
        .where(CourseStaff.course_id == course_id)
        .order_by(User.username)
    )
    return result.scalars().all()


@router.post(
    "/{course_id}/staff",
    response_model=StaffAssignResponse,
    summary="Assign asprak to a course",
    description=(
        "Superadmin only. Every matched username must be an active `asprak` account; "
        "otherwise the whole request is rejected with the offending usernames. "
        "Existing assignments are skipped rather than duplicated."
    ),
    responses={
        **UNAUTHENTICATED_401,
        **FORBIDDEN_403,
        **COURSE_NOT_FOUND_404,
        422: {"description": "One or more matched usernames are not active asprak accounts."},
    },
)
async def assign_staff(
    course_id: uuid.UUID,
    data: StaffAssignRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_superadmin),
):
    await _get_course_or_404(db, course_id)

    if not data.usernames:
        return {
            "message": "No usernames provided",
            "matched": 0,
            "added": 0,
            "skipped_duplicates": 0,
            "unmatched_usernames": [],
        }

    result = await db.execute(select(User).where(User.username.in_(data.usernames)))
    matched_users = result.scalars().all()
    matched_names = {u.username for u in matched_users}
    unmatched = sorted(set(data.usernames) - matched_names)

    invalid = sorted(
        u.username for u in matched_users
        if u.role != RoleEnum.ASPRAK or not u.is_active
    )
    if invalid:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Only active asprak accounts can be assigned as course staff",
                "invalid_usernames": invalid,
            },
        )
    if not matched_users:
        raise HTTPException(status_code=400, detail="No matching users found for provided usernames")

    values = [{"id": uuid.uuid4(), "course_id": course_id, "user_id": u.id} for u in matched_users]
    stmt = pg_insert(CourseStaff).values(values)
    stmt = stmt.on_conflict_do_nothing(constraint="uix_course_staff")
    result = await db.execute(stmt)
    assert isinstance(result, CursorResult)
    await db.commit()
    await cache_delete_pattern("cache:courses:*")

    return {
        "message": "Staff assignment successful",
        "matched": len(matched_users),
        "added": result.rowcount,
        "skipped_duplicates": len(matched_users) - result.rowcount,
        "unmatched_usernames": unmatched,
    }


@router.delete(
    "/{course_id}/staff/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a staff assignment from a course",
    description="Superadmin only.",
    responses={
        **UNAUTHENTICATED_401,
        **FORBIDDEN_403,
        404: {"description": "Course not found, or the user has no assignment on this course."},
    },
)
async def remove_staff(
    course_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_superadmin),
):
    await _get_course_or_404(db, course_id)

    result = await db.execute(
        delete(CourseStaff).where(
            CourseStaff.course_id == course_id,
            CourseStaff.user_id == user_id,
        )
    )
    assert isinstance(result, CursorResult)
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Staff assignment not found")
    await db.commit()
    await cache_delete_pattern("cache:courses:*")


@router.delete(
    "/{course_id}/students/{student_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a student enrollment from a course",
    description="Superadmin only.",
    responses={
        **UNAUTHENTICATED_401,
        **FORBIDDEN_403,
        404: {"description": "Course not found, or student is not enrolled in this course."},
    },
)
async def remove_student_enrollment(
    course_id: uuid.UUID,
    student_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_superadmin),
):
    await _get_course_or_404(db, course_id)

    result = await db.execute(
        delete(Enrollment).where(
            Enrollment.course_id == course_id,
            Enrollment.student_id == student_id,
        )
    )
    assert isinstance(result, CursorResult)
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Student enrollment not found")
    await db.commit()
    await cache_delete_pattern("cache:courses:*")

