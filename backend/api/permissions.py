import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models.user import User, RoleEnum
from models.course import Course
from models.class_session import ClassSession
from models.course_staff import CourseStaff
from models.enrollment import Enrollment

NOT_ASSIGNED_DETAIL = "You are not assigned to this course"
READ_ONLY_DETAIL = "Your role has read-only access to this course"


async def require_course_access(
    db: AsyncSession,
    user: User,
    course_id: uuid.UUID,
    *,
    write: bool,
) -> Course:
    """Authorize `user` against a course, returning it, or raise 403/404.

    - SUPERADMIN: full access.
    - ASPRAK: read/write on courses they have a course_staff assignment for.
    - PRAKTIKAN: read-only on courses they are enrolled in.
    """
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalars().first()
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    await _check_membership(db, user, course.id, write=write)
    return course


async def require_session_access(
    db: AsyncSession,
    user: User,
    session_id: uuid.UUID,
    *,
    write: bool,
) -> ClassSession:
    """Authorize `user` against a session's course, returning the session."""
    result = await db.execute(select(ClassSession).where(ClassSession.id == session_id))
    session = result.scalars().first()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    await _check_membership(db, user, session.course_id, write=write)
    return session


async def _check_membership(
    db: AsyncSession,
    user: User,
    course_id: uuid.UUID,
    *,
    write: bool,
) -> None:
    if user.role == RoleEnum.SUPERADMIN:
        return

    if user.role == RoleEnum.ASPRAK:
        result = await db.execute(
            select(CourseStaff.id).where(
                CourseStaff.course_id == course_id,
                CourseStaff.user_id == user.id,
            )
        )
        if result.first() is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=NOT_ASSIGNED_DETAIL)
        return

    if user.role == RoleEnum.PRAKTIKAN:
        if write:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=READ_ONLY_DETAIL)
        result = await db.execute(
            select(Enrollment.id).where(
                Enrollment.course_id == course_id,
                Enrollment.student_id == user.id,
            )
        )
        if result.first() is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not enrolled in this course",
            )
        return

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=NOT_ASSIGNED_DETAIL)


async def validate_enrolled_students(
    db: AsyncSession,
    course_id: uuid.UUID,
    student_ids: list[uuid.UUID],
) -> None:
    """Reject with 422 unless every ID is an active praktikan enrolled in the course."""
    if not student_ids:
        return
    result = await db.execute(
        select(Enrollment.student_id)
        .join(User, User.id == Enrollment.student_id)
        .where(
            Enrollment.course_id == course_id,
            Enrollment.student_id.in_(student_ids),
            User.role == RoleEnum.PRAKTIKAN,
            User.is_active.is_(True),
        )
    )
    valid_ids = {row[0] for row in result.all()}
    invalid = [str(sid) for sid in student_ids if sid not in valid_ids]
    if invalid:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Some students are not enrolled praktikan accounts in this course",
                "student_ids": invalid,
            },
        )
