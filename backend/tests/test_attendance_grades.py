import uuid

from sqlalchemy import select

from models.attendance import Attendance
from models.grade import Grade
from models.user import RoleEnum

from tests.helpers import (
    assign_course_staff,
    create_class_session,
    create_course,
    create_user,
    enroll_student,
    set_auth,
)


async def _setup_session(db):
    course = await create_course(db)
    session = await create_class_session(db, course)
    asprak = await create_user(db, RoleEnum.ASPRAK)
    await assign_course_staff(db, course, asprak)
    student = await create_user(db, RoleEnum.PRAKTIKAN)
    await enroll_student(db, course, student)
    return course, session, asprak, student


async def test_bulk_attendance_deduplicates_payload(client, db):
    _, session, asprak, student = await _setup_session(db)
    set_auth(client, asprak)

    resp = await client.post(
        f"/attendance/sessions/{session.id}/bulk",
        json={
            "records": [
                {"student_id": str(student.id), "status": "alfa"},
                {"student_id": str(student.id), "status": "hadir"},
            ]
        },
    )
    assert resp.status_code == 200

    rows = (await db.execute(select(Attendance).where(Attendance.session_id == session.id))).scalars().all()
    assert len(rows) == 1
    assert rows[0].status.value == "hadir"


async def test_bulk_attendance_unknown_session_404(client, db):
    _, _, asprak, student = await _setup_session(db)
    set_auth(client, asprak)

    resp = await client.post(
        f"/attendance/sessions/{uuid.uuid4()}/bulk",
        json={"records": [{"student_id": str(student.id), "status": "hadir"}]},
    )
    assert resp.status_code == 404


async def test_bulk_attendance_rejects_unenrolled_student(client, db):
    _, session, asprak, _ = await _setup_session(db)
    outsider = await create_user(db, RoleEnum.PRAKTIKAN)
    set_auth(client, asprak)

    resp = await client.post(
        f"/attendance/sessions/{session.id}/bulk",
        json={"records": [{"student_id": str(outsider.id), "status": "hadir"}]},
    )
    assert resp.status_code == 422
    assert str(outsider.id) in resp.json()["detail"]["student_ids"]


async def test_bulk_attendance_rejects_non_praktikan(client, db):
    course, session, asprak, _ = await _setup_session(db)
    admin = await create_user(db, RoleEnum.SUPERADMIN)
    await enroll_student(db, course, admin)
    set_auth(client, asprak)

    resp = await client.post(
        f"/attendance/sessions/{session.id}/bulk",
        json={"records": [{"student_id": str(admin.id), "status": "hadir"}]},
    )
    assert resp.status_code == 422


async def test_bulk_attendance_sets_audit_fields(client, db):
    _, session, asprak, student = await _setup_session(db)
    set_auth(client, asprak)

    resp = await client.post(
        f"/attendance/sessions/{session.id}/bulk",
        json={"records": [{"student_id": str(student.id), "status": "sakit"}]},
    )
    assert resp.status_code == 200

    row = (await db.execute(select(Attendance).where(Attendance.session_id == session.id))).scalars().one()
    assert row.recorded_by == asprak.id
    assert row.created_at is not None
    assert row.updated_at is not None


async def test_bulk_grades_score_out_of_range(client, db):
    _, session, asprak, student = await _setup_session(db)
    set_auth(client, asprak)

    for bad_score in (101, -1):
        resp = await client.post(
            f"/grades/sessions/{session.id}/bulk",
            json={"records": [{"student_id": str(student.id), "score": bad_score}]},
        )
        assert resp.status_code == 422


async def test_bulk_grades_upsert_and_audit(client, db):
    _, session, asprak, student = await _setup_session(db)
    set_auth(client, asprak)

    first = await client.post(
        f"/grades/sessions/{session.id}/bulk",
        json={"records": [{"student_id": str(student.id), "score": 70}]},
    )
    assert first.status_code == 200
    second = await client.post(
        f"/grades/sessions/{session.id}/bulk",
        json={"records": [{"student_id": str(student.id), "score": 85.5}]},
    )
    assert second.status_code == 200

    rows = (await db.execute(select(Grade).where(Grade.session_id == session.id))).scalars().all()
    assert len(rows) == 1
    assert rows[0].score == 85.5
    assert rows[0].recorded_by == asprak.id


async def test_grades_me_returns_own_records(client, db):
    _, session, asprak, student = await _setup_session(db)
    set_auth(client, asprak)
    await client.post(
        f"/grades/sessions/{session.id}/bulk",
        json={"records": [{"student_id": str(student.id), "score": 90}]},
    )
    
    await client.post(f"/grades/sessions/{session.id}/publish")

    set_auth(client, student)
    resp = await client.get("/grades/me")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["score"] == 90


async def test_praktikan_cannot_read_session_grades(client, db):
    course, session, _, student = await _setup_session(db)
    set_auth(client, student)

    resp = await client.get(f"/grades/sessions/{session.id}")
    assert resp.status_code == 403


async def test_delete_session_lifecycle_and_guards(client, db):
    course, session, asprak, student = await _setup_session(db)
    set_auth(client, asprak)

    await client.post(
        f"/grades/sessions/{session.id}/bulk",
        json={"records": [{"student_id": str(student.id), "score": 90}]},
    )
    await client.post(f"/grades/sessions/{session.id}/publish")

    del_blocked = await client.delete(f"/class-sessions/{session.id}")
    assert del_blocked.status_code == 400
    assert "Cannot delete session with published grades" in del_blocked.json()["detail"]

    await client.post(f"/grades/sessions/{session.id}/unpublish")

    del_ok = await client.delete(f"/class-sessions/{session.id}")
    assert del_ok.status_code == 204

    del_verify = await client.get(f"/attendance/sessions/{session.id}")
    assert del_verify.status_code == 404

