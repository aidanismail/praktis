import datetime
import uuid

from core.security import create_access_token, get_password_hash
from models.course import Course, ClassSession
from models.course_staff import CourseStaff
from models.enrollment import Enrollment
from models.user import User, RoleEnum

DEFAULT_PASSWORD = "praktis-test-password"
# bcrypt is slow; hash the shared test password once.
_PASSWORD_HASH = get_password_hash(DEFAULT_PASSWORD)


async def create_user(
    db,
    role: RoleEnum,
    username: str | None = None,
    *,
    is_active: bool = True,
    force_password_change: bool = False,
) -> User:
    username = username or f"u{uuid.uuid4().hex[:12]}"
    user = User(
        username=username,
        email=f"{username}@example.com",
        role=role,
        hashed_password=_PASSWORD_HASH,
        is_active=is_active,
        force_password_change=force_password_change,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


def set_auth(client, user: User) -> None:
    token = create_access_token({"sub": user.username, "role": user.role.value})
    client.cookies.set("access_token", f"Bearer {token}")


async def create_course(db, code: str | None = None) -> Course:
    course = Course(code=code or f"C{uuid.uuid4().hex[:8]}", name="Test Course")
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


async def create_class_session(db, course: Course) -> ClassSession:
    session = ClassSession(course_id=course.id, title="Pertemuan 1", date=datetime.date(2026, 7, 1))
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def enroll_student(db, course: Course, user: User) -> None:
    db.add(Enrollment(course_id=course.id, student_id=user.id))
    await db.commit()


async def assign_course_staff(db, course: Course, user: User) -> None:
    db.add(CourseStaff(course_id=course.id, user_id=user.id))
    await db.commit()
