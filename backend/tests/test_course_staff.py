from models.user import RoleEnum

from tests.helpers import (
    assign_course_staff,
    create_course,
    create_user,
    set_auth,
)


async def test_assign_and_list_staff(client, db):
    course = await create_course(db)
    admin = await create_user(db, RoleEnum.SUPERADMIN)
    asprak = await create_user(db, RoleEnum.ASPRAK)
    set_auth(client, admin)

    resp = await client.post(
        f"/courses/{course.id}/staff", json={"usernames": [asprak.username, "ghost"]}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["added"] == 1
    assert body["unmatched_usernames"] == ["ghost"]

    listing = await client.get(f"/courses/{course.id}/staff")
    assert listing.status_code == 200
    assert [s["username"] for s in listing.json()] == [asprak.username]


async def test_assign_staff_rejects_non_asprak(client, db):
    course = await create_course(db)
    admin = await create_user(db, RoleEnum.SUPERADMIN)
    student = await create_user(db, RoleEnum.PRAKTIKAN)
    set_auth(client, admin)

    resp = await client.post(
        f"/courses/{course.id}/staff", json={"usernames": [student.username]}
    )
    assert resp.status_code == 422
    assert student.username in resp.json()["detail"]["invalid_usernames"]


async def test_assign_staff_skips_duplicates(client, db):
    course = await create_course(db)
    admin = await create_user(db, RoleEnum.SUPERADMIN)
    asprak = await create_user(db, RoleEnum.ASPRAK)
    await assign_course_staff(db, course, asprak)
    set_auth(client, admin)

    resp = await client.post(
        f"/courses/{course.id}/staff", json={"usernames": [asprak.username]}
    )
    assert resp.status_code == 200
    assert resp.json()["added"] == 0
    assert resp.json()["skipped_duplicates"] == 1


async def test_non_superadmin_cannot_manage_staff(client, db):
    course = await create_course(db)
    asprak = await create_user(db, RoleEnum.ASPRAK)
    set_auth(client, asprak)

    resp = await client.post(
        f"/courses/{course.id}/staff", json={"usernames": [asprak.username]}
    )
    assert resp.status_code == 403


async def test_remove_staff(client, db):
    course = await create_course(db)
    admin = await create_user(db, RoleEnum.SUPERADMIN)
    asprak = await create_user(db, RoleEnum.ASPRAK)
    await assign_course_staff(db, course, asprak)
    set_auth(client, admin)

    resp = await client.delete(f"/courses/{course.id}/staff/{asprak.id}")
    assert resp.status_code == 204

    again = await client.delete(f"/courses/{course.id}/staff/{asprak.id}")
    assert again.status_code == 404
