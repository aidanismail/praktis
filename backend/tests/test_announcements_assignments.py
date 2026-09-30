import uuid
import pytest
from sqlalchemy import select

from models.user import RoleEnum
from models.announcement import Announcement, AnnouncementComment
from models.assignment import Assignment, Submission
from tests.helpers import (
    assign_course_staff,
    create_course,
    create_user,
    enroll_student,
    set_auth,
)


@pytest.mark.asyncio
async def test_announcement_lifecycle(client, db):
    course = await create_course(db)
    asprak = await create_user(db, RoleEnum.ASPRAK)
    await assign_course_staff(db, course, asprak)
    student = await create_user(db, RoleEnum.PRAKTIKAN)
    await enroll_student(db, course, student)

    set_auth(client, asprak)
    create_resp = await client.post(
        f"/courses/{course.id}/announcements",
        json={
            "title": "Welcome to Practicum 2025/2026",
            "content": "Please read the lab guidelines before next week.",
            "is_pinned": True,
        },
    )
    assert create_resp.status_code == 201
    ann_id = create_resp.json()["id"]
    assert create_resp.json()["title"] == "Welcome to Practicum 2025/2026"
    assert create_resp.json()["is_pinned"] is True

    set_auth(client, student)
    list_resp = await client.get(f"/courses/{course.id}/announcements")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1
    assert list_resp.json()[0]["id"] == ann_id

    comment_resp = await client.post(
        f"/courses/{course.id}/announcements/{ann_id}/comments",
        json={"content": "Thank you, noted!"},
    )
    assert comment_resp.status_code == 201
    comment_id = comment_resp.json()["id"]
    assert comment_resp.json()["content"] == "Thank you, noted!"

    del_comment_resp = await client.delete(
        f"/courses/{course.id}/announcements/{ann_id}/comments/{comment_id}"
    )
    assert del_comment_resp.status_code == 204

    set_auth(client, asprak)
    del_ann_resp = await client.delete(f"/courses/{course.id}/announcements/{ann_id}")
    assert del_ann_resp.status_code == 204


@pytest.mark.asyncio
async def test_assignment_lifecycle_and_grading(client, db):
    course = await create_course(db)
    asprak = await create_user(db, RoleEnum.ASPRAK)
    await assign_course_staff(db, course, asprak)
    student = await create_user(db, RoleEnum.PRAKTIKAN)
    await enroll_student(db, course, student)

    set_auth(client, asprak)
    create_resp = await client.post(
        f"/courses/{course.id}/assignments",
        json={
            "title": "Tugas 1: Pointer & Memory",
            "description": "Implement double pointer in C++.",
            "max_points": 100,
            "allowed_file_types": "pdf,zip",
            "is_published": True,
        },
    )
    assert create_resp.status_code == 201
    assign_id = create_resp.json()["id"]
    assert create_resp.json()["title"] == "Tugas 1: Pointer & Memory"

    set_auth(client, student)
    list_resp = await client.get(f"/courses/{course.id}/assignments")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1
    assert list_resp.json()[0]["id"] == assign_id

    submission = Submission(
        assignment_id=uuid.UUID(assign_id),
        student_id=student.id,
        file_key=f"assignments/{assign_id}/{student.id}/test_tugas.pdf",
        file_name="test_tugas.pdf",
        file_size=1024,
        is_late=False,
        status="submitted",
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    set_auth(client, asprak)
    sub_list_resp = await client.get(f"/courses/{course.id}/assignments/{assign_id}/submissions")
    assert sub_list_resp.status_code == 200
    assert len(sub_list_resp.json()) == 1
    assert sub_list_resp.json()[0]["student_username"] == student.username

    grade_resp = await client.post(
        f"/courses/{course.id}/assignments/{assign_id}/submissions/{submission.id}/grade",
        json={"score": 95.5, "feedback": "Excellent clean implementation!"},
    )
    assert grade_resp.status_code == 200
    assert grade_resp.json()["score"] == 95.5
    assert grade_resp.json()["feedback"] == "Excellent clean implementation!"
    assert grade_resp.json()["status"] == "graded"


@pytest.mark.asyncio
async def test_announcement_comment_anti_spam(client, db):
    course = await create_course(db)
    asprak = await create_user(db, RoleEnum.ASPRAK)
    await assign_course_staff(db, course, asprak)
    student = await create_user(db, RoleEnum.PRAKTIKAN)
    await enroll_student(db, course, student)

    set_auth(client, asprak)
    ann_res = await client.post(
        f"/courses/{course.id}/announcements",
        json={"title": "Anti-Spam Verification", "content": "Post comments here"},
    )
    assert ann_res.status_code == 201
    ann_id = ann_res.json()["id"]

    set_auth(client, student)

    oversized_res = await client.post(
        f"/courses/{course.id}/announcements/{ann_id}/comments",
        json={"content": "A" * 1001},
    )
    assert oversized_res.status_code == 422

    empty_res = await client.post(
        f"/courses/{course.id}/announcements/{ann_id}/comments",
        json={"content": "   \n\t  "},
    )
    assert empty_res.status_code == 422

    valid_res = await client.post(
        f"/courses/{course.id}/announcements/{ann_id}/comments",
        json={"content": "First valid comment"},
    )
    assert valid_res.status_code == 201

    dup_res = await client.post(
        f"/courses/{course.id}/announcements/{ann_id}/comments",
        json={"content": "First valid comment"},
    )
    assert dup_res.status_code == 400
    assert "Duplicate comment detected" in dup_res.json()["detail"]

    cooldown_res = await client.post(
        f"/courses/{course.id}/announcements/{ann_id}/comments",
        json={"content": "Second different comment"},
    )
    assert cooldown_res.status_code == 429


@pytest.mark.asyncio
async def test_asprak_can_moderate_comments(client, db):
    course = await create_course(db)
    asprak = await create_user(db, RoleEnum.ASPRAK)
    await assign_course_staff(db, course, asprak)
    student1 = await create_user(db, RoleEnum.PRAKTIKAN)
    await enroll_student(db, course, student1)
    student2 = await create_user(db, RoleEnum.PRAKTIKAN)
    await enroll_student(db, course, student2)

    set_auth(client, asprak)
    ann_resp = await client.post(
        f"/courses/{course.id}/announcements",
        json={"title": "Important Notice", "content": "Notice details"},
    )
    assert ann_resp.status_code == 201
    ann_id = ann_resp.json()["id"]

    set_auth(client, student1)
    comm_resp = await client.post(
        f"/courses/{course.id}/announcements/{ann_id}/comments",
        json={"content": "Spam message here"},
    )
    assert comm_resp.status_code == 201
    comm_id = comm_resp.json()["id"]

    set_auth(client, student2)
    unauthorized_del = await client.delete(
        f"/courses/{course.id}/announcements/{ann_id}/comments/{comm_id}"
    )
    assert unauthorized_del.status_code == 403

    set_auth(client, asprak)
    mod_del = await client.delete(
        f"/courses/{course.id}/announcements/{ann_id}/comments/{comm_id}"
    )
    assert mod_del.status_code == 204

