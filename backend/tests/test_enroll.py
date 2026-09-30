from models.user import RoleEnum

from tests.helpers import create_course, create_user, set_auth


async def test_enroll_filters_non_praktikan_and_reports_unmatched(client, db):
    course = await create_course(db)
    admin = await create_user(db, RoleEnum.SUPERADMIN)
    student = await create_user(db, RoleEnum.PRAKTIKAN)
    asprak = await create_user(db, RoleEnum.ASPRAK)
    inactive = await create_user(db, RoleEnum.PRAKTIKAN, is_active=False)
    set_auth(client, admin)

    resp = await client.post(
        f"/courses/{course.id}/enroll",
        json={"usernames": [student.username, asprak.username, inactive.username, "ghost"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["matched"] == 1
    assert body["enrolled"] == 1
    assert body["unmatched_usernames"] == ["ghost"]
    assert sorted(body["skipped_invalid"]) == sorted([asprak.username, inactive.username])


async def test_enroll_no_valid_students_400(client, db):
    course = await create_course(db)
    admin = await create_user(db, RoleEnum.SUPERADMIN)
    asprak = await create_user(db, RoleEnum.ASPRAK)
    set_auth(client, admin)

    resp = await client.post(
        f"/courses/{course.id}/enroll", json={"usernames": [asprak.username]}
    )
    assert resp.status_code == 400


async def test_enroll_skips_already_enrolled(client, db):
    course = await create_course(db)
    admin = await create_user(db, RoleEnum.SUPERADMIN)
    student = await create_user(db, RoleEnum.PRAKTIKAN)
    set_auth(client, admin)

    first = await client.post(
        f"/courses/{course.id}/enroll", json={"usernames": [student.username]}
    )
    assert first.json()["enrolled"] == 1

    second = await client.post(
        f"/courses/{course.id}/enroll", json={"usernames": [student.username]}
    )
    assert second.json()["enrolled"] == 0
    assert second.json()["skipped_duplicates"] == 1
