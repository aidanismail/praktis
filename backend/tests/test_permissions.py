from models.user import RoleEnum
from services.storage_service import storage_service

from tests.helpers import (
    assign_course_staff,
    create_class_session,
    create_course,
    create_user,
    enroll_student,
    set_auth,
)


async def test_praktikan_cannot_list_modules_of_unenrolled_course(client, db):
    course = await create_course(db)
    student = await create_user(db, RoleEnum.PRAKTIKAN)
    set_auth(client, student)

    resp = await client.get("/modules/", params={"course_id": str(course.id)})
    assert resp.status_code == 403


async def test_praktikan_can_list_modules_of_enrolled_course(client, db):
    course = await create_course(db)
    student = await create_user(db, RoleEnum.PRAKTIKAN)
    await enroll_student(db, course, student)
    set_auth(client, student)

    resp = await client.get("/modules/", params={"course_id": str(course.id)})
    assert resp.status_code == 200
    assert resp.json() == []


async def test_unassigned_asprak_cannot_presign(client, db):
    course = await create_course(db)
    asprak = await create_user(db, RoleEnum.ASPRAK)
    set_auth(client, asprak)

    resp = await client.post(
        "/modules/presigned-url",
        json={"title": "Mod", "file_extension": ".pdf", "course_id": str(course.id)},
    )
    assert resp.status_code == 403


async def test_assigned_asprak_can_presign(client, db, monkeypatch):
    course = await create_course(db)
    asprak = await create_user(db, RoleEnum.ASPRAK)
    await assign_course_staff(db, course, asprak)
    set_auth(client, asprak)

    monkeypatch.setattr(
        storage_service, "generate_presigned_upload_url", lambda key: f"http://test/{key}"
    )
    resp = await client.post(
        "/modules/presigned-url",
        json={"title": "Mod", "file_extension": ".pdf", "course_id": str(course.id)},
    )
    assert resp.status_code == 200
    assert resp.json()["file_key"].endswith(".pdf")


async def test_confirm_rejects_unuploaded_file(client, db, monkeypatch):
    course = await create_course(db)
    asprak = await create_user(db, RoleEnum.ASPRAK)
    await assign_course_staff(db, course, asprak)
    set_auth(client, asprak)

    async def fake_head(key):
        return None

    monkeypatch.setattr(storage_service, "head_object", fake_head)
    resp = await client.post(
        "/modules/confirm",
        json={
            "title": "Mod",
            "file_key": f"{'a' * 32}.pdf",
            "course_id": str(course.id),
        },
    )
    assert resp.status_code == 400


async def test_confirm_rejects_bad_file_key_format(client, db):
    course = await create_course(db)
    asprak = await create_user(db, RoleEnum.ASPRAK)
    await assign_course_staff(db, course, asprak)
    set_auth(client, asprak)

    resp = await client.post(
        "/modules/confirm",
        json={"title": "Mod", "file_key": "../../etc/passwd", "course_id": str(course.id)},
    )
    assert resp.status_code == 422


async def test_praktikan_cannot_write_attendance(client, db):
    course = await create_course(db)
    session = await create_class_session(db, course)
    student = await create_user(db, RoleEnum.PRAKTIKAN)
    await enroll_student(db, course, student)
    set_auth(client, student)

    resp = await client.post(
        f"/attendance/sessions/{session.id}/bulk",
        json={"records": [{"student_id": str(student.id), "status": "hadir"}]},
    )
    assert resp.status_code == 403


async def test_unassigned_asprak_cannot_write_attendance(client, db):
    course = await create_course(db)
    session = await create_class_session(db, course)
    asprak = await create_user(db, RoleEnum.ASPRAK)
    set_auth(client, asprak)

    resp = await client.post(
        f"/attendance/sessions/{session.id}/bulk",
        json={"records": []},
    )
    assert resp.status_code == 403


async def test_asprak_course_list_scoped_to_assignments(client, db):
    assigned = await create_course(db)
    await create_course(db)
    asprak = await create_user(db, RoleEnum.ASPRAK)
    await assign_course_staff(db, assigned, asprak)
    set_auth(client, asprak)

    resp = await client.get("/courses/")
    assert resp.status_code == 200
    ids = [c["id"] for c in resp.json()]
    assert ids == [str(assigned.id)]


async def test_praktikan_cannot_list_sessions_of_unenrolled_course(client, db):
    course = await create_course(db)
    await create_class_session(db, course)
    student = await create_user(db, RoleEnum.PRAKTIKAN)
    set_auth(client, student)

    resp = await client.get(f"/courses/{course.id}/sessions")
    assert resp.status_code == 403
