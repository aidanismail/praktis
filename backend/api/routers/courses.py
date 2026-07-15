import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy import CursorResult

from core.database import get_db
from core.cache import cache_get, cache_set, cache_delete_pattern
from models.user import User, RoleEnum
from models.course import Course, ClassSession
from models.enrollment import Enrollment
from api.dependencies import get_current_active_user, RoleChecker
from schemas.course import (
    CourseCreate,
    CourseResponse,
    EnrollRequest,
    EnrollResponse,
    ClassSessionCreate,
    ClassSessionResponse,
    EnrolledStudentResponse,
)

router = APIRouter(prefix="/courses", tags=["Courses"])

require_superadmin = RoleChecker([RoleEnum.SUPERADMIN])
require_staff = RoleChecker([RoleEnum.SUPERADMIN, RoleEnum.ASPRAK])
require_view = RoleChecker([RoleEnum.SUPERADMIN, RoleEnum.ASPRAK])

UNAUTHENTICATED_401 = {401: {"description": "Missing or invalid session cookie."}}
FORBIDDEN_403 = {403: {"description": "Caller's role isn't permitted here, or a password change is still pending."}}
COURSE_NOT_FOUND_404 = {404: {"description": "No course exists with the given course_id."}}


@router.post(
    "/",
    response_model=CourseResponse,
    summary="Create a course",
    description="Superadmin only. Course `code` must be unique.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, 400: {"description": "Course code already exists."}},
)
async def create_course(
    data: CourseCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_superadmin),
):
    existing = await db.execute(select(Course).where(Course.code == data.code))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Course code already exists")

    course = Course(code=data.code, name=data.name)
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


@router.get(
    "/",
    response_model=list[CourseResponse],
    summary="List courses",
    description=(
        "A `praktikan` sees only courses they're enrolled in; every other role sees all "
        "courses. Results are cached for ~30s per (role, user)."
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


@router.post(
    "/{course_id}/enroll",
    response_model=EnrollResponse,
    summary="Enroll students in a course",
    description=(
        "Superadmin only. `usernames` are matched against existing accounts (typically "
        "students' NPMs); usernames with no matching account are ignored, and students "
        "already enrolled are skipped rather than duplicated."
    ),
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **COURSE_NOT_FOUND_404, 400: {"description": "None of the given usernames matched an existing user."}},
)
async def enroll_students(
    course_id: uuid.UUID,
    data: EnrollRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_superadmin),
):
    await _get_course_or_404(db, course_id)

    if not data.usernames:
        return {"message": "No usernames provided", "matched": 0, "enrolled": 0, "skipped_duplicates": 0}

    result = await db.execute(select(User).where(User.username.in_(data.usernames)))
    users = result.scalars().all()
    if not users:
        raise HTTPException(status_code=400, detail="No matching users found for provided usernames")

    values = [{"id": uuid.uuid4(), "course_id": course_id, "student_id": u.id} for u in users]
    stmt = pg_insert(Enrollment).values(values)
    stmt = stmt.on_conflict_do_nothing(constraint="uix_course_student")
    result = await db.execute(stmt)
    assert isinstance(result, CursorResult)
    await db.commit()
    await cache_delete_pattern("cache:courses:*")

    return {
        "message": "Enrollment successful",
        "matched": len(users),
        "enrolled": result.rowcount,
        "skipped_duplicates": len(users) - result.rowcount,
    }


@router.post(
    "/{course_id}/sessions",
    response_model=ClassSessionResponse,
    summary="Create a class session",
    description="Superadmin/asprak only. Represents one lab meeting (e.g. 'Pertemuan 1') that attendance and grades are recorded against.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **COURSE_NOT_FOUND_404},
)
async def create_session(
    course_id: uuid.UUID,
    data: ClassSessionCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_staff),
):
    await _get_course_or_404(db, course_id)

    session = ClassSession(course_id=course_id, title=data.title, date=data.date)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get(
    "/{course_id}/sessions",
    response_model=list[ClassSessionResponse],
    summary="List a course's sessions",
    description="Available to any authenticated, non-locked user. Ordered by date.",
    responses={**UNAUTHENTICATED_401, **COURSE_NOT_FOUND_404},
)
async def list_sessions(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_active_user),
):
    await _get_course_or_404(db, course_id)

    result = await db.execute(
        select(ClassSession).where(ClassSession.course_id == course_id).order_by(ClassSession.date)
    )
    return result.scalars().all()


@router.get(
    "/{course_id}/students",
    response_model=list[EnrolledStudentResponse],
    summary="List a course's enrolled students",
    description=(
        "Superadmin/asprak only. Used by the attendance/grading UI to know which "
        "students to display. Cached for ~30s per course."
    ),
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **COURSE_NOT_FOUND_404},
)
async def list_students(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_view),
):
    await _get_course_or_404(db, course_id)

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
