import asyncio
import datetime
from datetime import timezone
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy.future import select
from core.database import AsyncSessionLocal
from core.security import get_password_hash
from models.user import User, RoleEnum
from models.course import Course
from models.course_staff import CourseStaff
from models.enrollment import Enrollment
from models.class_session import ClassSession
from models.module import Module
from models.attendance import Attendance, AttendanceStatus
from models.grade import Grade
from models.announcement import Announcement, AnnouncementComment
from models.assignment import Assignment, Submission


USERS_DATA = [
    {
        "username": "admin",
        "email": "admin@praktis.unpad.ac.id",
        "role": RoleEnum.SUPERADMIN,
        "password": "aidanbagas123",
        "force_password_change": False,
    },
    {
        "username": "asprak1",
        "email": "asprak1@unpad.ac.id",
        "role": RoleEnum.ASPRAK,
        "password": "asprak123",
        "force_password_change": False,
    },
    {
        "username": "140810230001",
        "email": "student1@unpad.ac.id",
        "role": RoleEnum.PRAKTIKAN,
        "password": "password123",
        "force_password_change": True,
    }
]

async def seed_data():
    async with AsyncSessionLocal() as db:
        print("Start Seed")

        user_map = {}
        for u_data in USERS_DATA:
            res = await db.execute(select(User).where(User.username == u_data["username"]))
            user = res.scalar_one_or_none()

            if not user:
                user = User(
                    id=uuid.uuid4(),
                    email=u_data["email"],
                    username=u_data["username"],
                    hashed_password=get_password_hash(u_data["password"]),
                    role=u_data["role"],
                    force_password_change=u_data["force_password_change"],
                    is_active=True,
                )
                db.add(user)
                await db.flush()
                print(f"[Users] Created: {user.username} ({user.role})")
            else:
                print(f"[Users] Exists: {user.username}")

            user_map[u_data["username"]] = user(
                    select(Enrollment).where(
                        Enrollment.course_id == course.id,
                        Enrollment.student_id == student.id,
                    )
                )

        db.commit()
        print("Done Seeding")


if __name__ == "__main__":
    asyncio.run(seed_data())
