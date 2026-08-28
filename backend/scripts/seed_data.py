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
        "username": "asprak2",
        "email": "asprak2@unpad.ac.id",
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
    },
    {
        "username": "140810230002",
        "email": "student2@unpad.ac.id",
        "role": RoleEnum.PRAKTIKAN,
        "password": "password123",
        "force_password_change": False,
    },
    {
        "username": "140810230003",
        "email": "student3@unpad.ac.id",
        "role": RoleEnum.PRAKTIKAN,
        "password": "password123",
        "force_password_change": False,
    },
    {
        "username": "140810230004",
        "email": "student4@unpad.ac.id",
        "role": RoleEnum.PRAKTIKAN,
        "password": "password123",
        "force_password_change": False,
    },
    {
        "username": "140810230005",
        "email": "student5@unpad.ac.id",
        "role": RoleEnum.PRAKTIKAN,
        "password": "password123",
        "force_password_change": False,
    },
]

COURSES_DATA = [
    {
        "code": "IF2101",
        "name": "Pemrograman Web",
        "academic_year": "2025/2026",
        "semester": "Ganjil",
        "is_active": True,
        "staff_usernames": ["asprak1"],
    },
    {
        "code": "IF2102",
        "name": "Struktur Data",
        "academic_year": "2025/2026",
        "semester": "Ganjil",
        "is_active": True,
        "staff_usernames": ["asprak2"],
    },
    {
        "code": "IF1201",
        "name": "Pemrograman Dasar",
        "academic_year": "2024/2025",
        "semester": "Genap",
        "is_active": False,
        "staff_usernames": ["asprak1"],
    },
]


async def seed_data():
    async with AsyncSessionLocal() as db:
        print("--- Starting Database Seeding ---")

        # 1. Seed Users
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
            user_map[u_data["username"]] = user

        # 2. Seed Courses & Staff Assignments
        course_map = {}
        for c_data in COURSES_DATA:
            res = await db.execute(
                select(Course).where(
                    Course.code == c_data["code"],
                    Course.academic_year == c_data["academic_year"],
                    Course.semester == c_data["semester"],
                )
            )
            course = res.scalar_one_or_none()

            if not course:
                course = Course(
                    id=uuid.uuid4(),
                    code=c_data["code"],
                    name=c_data["name"],
                    academic_year=c_data["academic_year"],
                    semester=c_data["semester"],
                    is_active=c_data["is_active"],
                )
                db.add(course)
                await db.flush()
                print(f"[Courses] Created: {course.code} - {course.name}")
            else:
                course.is_active = c_data["is_active"]
                print(f"[Courses] Updated is_active={course.is_active}: {course.code}")
            course_map[c_data["code"]] = course

            # Assign Staff
            for staff_username in c_data["staff_usernames"]:
                staff_user = user_map.get(staff_username)
                if staff_user:
                    res_staff = await db.execute(
                        select(CourseStaff).where(
                            CourseStaff.course_id == course.id,
                            CourseStaff.user_id == staff_user.id,
                        )
                    )
                    if not res_staff.scalar_one_or_none():
                        cs = CourseStaff(
                            id=uuid.uuid4(),
                            course_id=course.id,
                            user_id=staff_user.id,
                        )
                        db.add(cs)
                        print(f"[CourseStaff] Assigned {staff_username} to {course.code}")

        # 3. Seed Enrollments (Enroll all students in IF2101 & IF2102)
        students = [u for u in user_map.values() if u.role == RoleEnum.PRAKTIKAN]
        active_courses = [course_map["IF2101"], course_map["IF2102"]]

        for course in active_courses:
            for student in students:
                res_e = await db.execute(
                    select(Enrollment).where(
                        Enrollment.course_id == course.id,
                        Enrollment.student_id == student.id,
                    )
                )
                if not res_e.scalar_one_or_none():
                    enrollment = Enrollment(
                        id=uuid.uuid4(),
                        course_id=course.id,
                        student_id=student.id,
                    )
                    db.add(enrollment)
                    print(f"[Enrollments] Enrolled {student.username} in {course.code}")

        # 4. Seed Modules
        admin_user = user_map["admin"]
        modules_def = [
            {"title": "Modul 1: Pengenalan HTML & CSS", "desc": "Dasar-dasar HTML5 dan styling CSS", "code": "IF2101"},
            {"title": "Modul 2: JavaScript & DOM", "desc": "Manipulasi DOM dan Event Handling", "code": "IF2101"},
            {"title": "Modul 1: Abstract Data Types", "desc": "Pengenalan ADT dan Pointer", "code": "IF2102"},
            {"title": "Modul 2: Linked List Implementation", "desc": "Single dan Double Linked List", "code": "IF2102"},
        ]

        for m_def in modules_def:
            target_course = course_map[m_def["code"]]
            file_key = f"modules/{target_course.code.lower()}/{m_def['title'].lower().replace(' ', '_')}.pdf"
            res_m = await db.execute(select(Module).where(Module.file_key == file_key))
            if not res_m.scalar_one_or_none():
                mod = Module(
                    id=uuid.uuid4(),
                    title=m_def["title"],
                    description=m_def["desc"],
                    file_key=file_key,
                    course_id=target_course.id,
                    uploaded_by=admin_user.id,
                    is_published=True,
                )
                db.add(mod)
                print(f"[Modules] Created: {mod.title} for {m_def['code']}")

        # 5. Seed Class Sessions, Attendances, and Grades
        sessions_def = [
            {
                "course_code": "IF2101",
                "title": "Pertemuan 1: HTML & CSS",
                "date": datetime.date(2025, 9, 8),
                "published": True,
                "asprak": user_map["asprak1"],
            },
            {
                "course_code": "IF2101",
                "title": "Pertemuan 2: JavaScript DOM",
                "date": datetime.date(2025, 9, 15),
                "published": False,
                "asprak": user_map["asprak1"],
            },
            {
                "course_code": "IF2102",
                "title": "Pertemuan 1: ADT & Pointer",
                "date": datetime.date(2025, 9, 9),
                "published": True,
                "asprak": user_map["asprak2"],
            },
        ]

        now_utc = datetime.datetime.now(timezone.utc)

        for s_def in sessions_def:
            target_course = course_map[s_def["course_code"]]
            res_s = await db.execute(
                select(ClassSession).where(
                    ClassSession.course_id == target_course.id,
                    ClassSession.title == s_def["title"],
                )
            )
            session_obj = res_s.scalar_one_or_none()

            if not session_obj:
                session_obj = ClassSession(
                    id=uuid.uuid4(),
                    course_id=target_course.id,
                    title=s_def["title"],
                    date=s_def["date"],
                    attendance_status="COMPLETED",
                    grades_published=s_def["published"],
                    grades_published_at=now_utc if s_def["published"] else None,
                    grades_published_by=s_def["asprak"].id if s_def["published"] else None,
                )
                db.add(session_obj)
                await db.flush()
                print(f"[ClassSessions] Created: {session_obj.title} ({target_course.code})")

            # Seed Attendance & Grades for each student in session
            for idx, student in enumerate(students):
                # Attendance
                res_att = await db.execute(
                    select(Attendance).where(
                        Attendance.session_id == session_obj.id,
                        Attendance.student_id == student.id,
                    )
                )
                if not res_att.scalar_one_or_none():
                    att_status = AttendanceStatus.HADIR if idx != 4 else AttendanceStatus.IZIN
                    att = Attendance(
                        id=uuid.uuid4(),
                        session_id=session_obj.id,
                        student_id=student.id,
                        status=att_status,
                        recorded_by=s_def["asprak"].id,
                    )
                    db.add(att)

                # Grade
                res_gr = await db.execute(
                    select(Grade).where(
                        Grade.session_id == session_obj.id,
                        Grade.student_id == student.id,
                    )
                )
                if not res_gr.scalar_one_or_none():
                    score = float(80 + (idx * 3))
                    gr = Grade(
                        id=uuid.uuid4(),
                        session_id=session_obj.id,
                        student_id=student.id,
                        score=score,
                        recorded_by=s_def["asprak"].id,
                    )
                    db.add(gr)

        # 6. Seed Course Stream Announcements & Comments
        if2101 = course_map["IF2101"]
        asprak1 = user_map["asprak1"]
        student1 = user_map["140810230001"]

        res_ann = await db.execute(
            select(Announcement).where(Announcement.course_id == if2101.id)
        )
        existing_ann = res_ann.scalars().all()
        if not existing_ann:
            ann1 = Announcement(
                id=uuid.uuid4(),
                course_id=if2101.id,
                author_id=asprak1.id,
                title="Selamat Datang di Praktikum Pemrograman Web 2025/2026",
                content="Halo rekan-rekan praktikan! Mohon untuk mengunduh Modul 1 dan membaca tata tertib lab sebelum sesi minggu depan.",
                is_pinned=True,
            )
            db.add(ann1)
            await db.flush()

            # Seed Comment
            comment1 = AnnouncementComment(
                id=uuid.uuid4(),
                announcement_id=ann1.id,
                author_id=student1.id,
                content="Baik Kak, terima kasih infonya!",
            )
            db.add(comment1)
            print(f"[Announcements] Created announcement & comment for {if2101.code}")

        # 7. Seed Classwork Assignments & Submissions
        res_assign = await db.execute(
            select(Assignment).where(Assignment.course_id == if2101.id)
        )
        existing_assign = res_assign.scalars().all()
        if not existing_assign:
            assign1 = Assignment(
                id=uuid.uuid4(),
                course_id=if2101.id,
                title="Tugas 1: Membuat Layout Web Responsif",
                description="Buatlah landing page sederhana menggunakan HTML5 dan CSS Grid/Flexbox. Format pengumpulan: file .pdf atau .zip.",
                due_date=now_utc + datetime.timedelta(days=7),
                max_points=100,
                allowed_file_types="pdf,zip",
                is_published=True,
                created_by=asprak1.id,
            )
            db.add(assign1)
            await db.flush()

            # Seed Submission
            sub1 = Submission(
                id=uuid.uuid4(),
                assignment_id=assign1.id,
                student_id=student1.id,
                file_key=f"assignments/{assign1.id}/{student1.id}/tugas1_140810230001.pdf",
                file_name="tugas1_140810230001.pdf",
                file_size=2048,
                submitted_at=now_utc,
                is_late=False,
                score=92.5,
                feedback="Desain web sangat rapi dan responsif.",
                graded_by=asprak1.id,
                graded_at=now_utc,
                status="graded",
            )
            db.add(sub1)
            print(f"[Assignments] Created assignment & student submission for {if2101.code}")

        await db.commit()
        print("--- Database Seeding Completed Successfully! ---")


if __name__ == "__main__":
    asyncio.run(seed_data())
