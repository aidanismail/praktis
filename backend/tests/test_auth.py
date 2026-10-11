from core.security import create_access_token
from models.user import RoleEnum

from tests.helpers import DEFAULT_PASSWORD, create_user, set_auth


async def test_login_success_sets_cookie(client, db):
    user = await create_user(db, RoleEnum.PRAKTIKAN)
    resp = await client.post(
        "/auth/login", json={"username": user.username, "password": DEFAULT_PASSWORD}
    )
    assert resp.status_code == 200
    assert "access_token" in resp.cookies


async def test_login_inactive_user_rejected(client, db):
    user = await create_user(db, RoleEnum.PRAKTIKAN, is_active=False)
    resp = await client.post(
        "/auth/login", json={"username": user.username, "password": DEFAULT_PASSWORD}
    )
    assert resp.status_code == 401
    assert "access_token" not in resp.cookies


async def test_login_unknown_user_generic_401(client, db):
    resp = await client.post(
        "/auth/login", json={"username": "nobody", "password": "whatever!"}
    )
    assert resp.status_code == 401


async def test_change_password_too_short(client, db):
    user = await create_user(db, RoleEnum.PRAKTIKAN)
    set_auth(client, user)
    resp = await client.post(
        "/auth/change-password",
        json={"old_password": DEFAULT_PASSWORD, "new_password": "short"},
    )
    assert resp.status_code == 422


async def test_change_password_over_72_bytes(client, db):
    user = await create_user(db, RoleEnum.PRAKTIKAN)
    set_auth(client, user)
    resp = await client.post(
        "/auth/change-password",
        json={"old_password": DEFAULT_PASSWORD, "new_password": "x" * 80},
    )
    assert resp.status_code == 422


async def test_change_password_success(client, db):
    user = await create_user(db, RoleEnum.PRAKTIKAN, force_password_change=True)
    set_auth(client, user)
    resp = await client.post(
        "/auth/change-password",
        json={"old_password": DEFAULT_PASSWORD, "new_password": "new-password-123"},
    )
    assert resp.status_code == 200
    login = await client.post(
        "/auth/login", json={"username": user.username, "password": "new-password-123"}
    )
    assert login.status_code == 200


async def test_update_profile_name_success(client, db):
    user = await create_user(db, RoleEnum.PRAKTIKAN)
    set_auth(client, user)
    resp = await client.patch(
        "/auth/me",
        json={"name": "Plastic Trees"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Plastic Trees"
    assert data["username"] == user.username


async def test_update_profile_name_blank_rejected(client, db):
    user = await create_user(db, RoleEnum.PRAKTIKAN)
    set_auth(client, user)
    resp = await client.patch(
        "/auth/me",
        json={"name": "   "},
    )
    assert resp.status_code == 400


async def test_update_profile_unauthenticated(client, db):
    resp = await client.patch(
        "/auth/me",
        json={"name": "New Name"},
    )
    assert resp.status_code == 401


async def test_update_profile_email_success(client, db):
    user = await create_user(db, RoleEnum.PRAKTIKAN, name="Keep Me")
    set_auth(client, user)
    new_email = f"new-{user.username}@example.com"
    resp = await client.patch("/auth/me", json={"email": new_email})
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == new_email
    assert data["name"] == "Keep Me"


async def test_update_profile_email_taken_rejected(client, db):
    other = await create_user(db, RoleEnum.PRAKTIKAN)
    user = await create_user(db, RoleEnum.PRAKTIKAN)
    set_auth(client, user)
    resp = await client.patch("/auth/me", json={"email": other.email.upper()})
    assert resp.status_code == 409
    assert "already used" in resp.json()["detail"]


async def test_update_profile_same_email_allowed(client, db):
    user = await create_user(db, RoleEnum.PRAKTIKAN)
    set_auth(client, user)
    resp = await client.patch("/auth/me", json={"name": "X", "email": user.email})
    assert resp.status_code == 200


async def test_update_profile_invalid_email_rejected(client, db):
    user = await create_user(db, RoleEnum.PRAKTIKAN)
    set_auth(client, user)
    resp = await client.patch("/auth/me", json={"email": "not-an-email"})
    assert resp.status_code == 422


async def test_update_profile_empty_body_rejected(client, db):
    user = await create_user(db, RoleEnum.PRAKTIKAN)
    set_auth(client, user)
    resp = await client.patch("/auth/me", json={})
    assert resp.status_code == 400


async def test_update_profile_username_staff_success(client, db):
    for role in (RoleEnum.ASPRAK, RoleEnum.SUPERADMIN):
        user = await create_user(db, role)
        set_auth(client, user)
        new_username = f"renamed-{user.username}"
        resp = await client.patch("/auth/me", json={"username": f"  {new_username} "})
        assert resp.status_code == 200
        assert resp.json()["username"] == new_username
        me = await client.get("/auth/me")
        assert me.status_code == 200
        assert me.json()["username"] == new_username


async def test_token_keyed_on_username_rejected(client, db):
    user = await create_user(db, RoleEnum.ASPRAK)
    token = create_access_token({"sub": user.username, "role": user.role.value})
    client.cookies.set("access_token", f"Bearer {token}")
    resp = await client.get("/auth/me")
    assert resp.status_code == 401


async def test_update_profile_username_praktikan_forbidden(client, db):
    user = await create_user(db, RoleEnum.PRAKTIKAN)
    set_auth(client, user)
    resp = await client.patch("/auth/me", json={"username": "new-npm"})
    assert resp.status_code == 403
    me = await client.get("/auth/me")
    assert me.json()["username"] == user.username


async def test_update_profile_username_praktikan_unchanged_allowed(client, db):
    user = await create_user(db, RoleEnum.PRAKTIKAN)
    set_auth(client, user)
    resp = await client.patch("/auth/me", json={"name": "X", "username": user.username})
    assert resp.status_code == 200


async def test_update_profile_username_taken_rejected(client, db):
    other = await create_user(db, RoleEnum.PRAKTIKAN)
    user = await create_user(db, RoleEnum.ASPRAK)
    set_auth(client, user)
    resp = await client.patch("/auth/me", json={"username": other.username})
    assert resp.status_code == 409


async def test_update_profile_username_blank_rejected(client, db):
    user = await create_user(db, RoleEnum.ASPRAK)
    set_auth(client, user)
    resp = await client.patch("/auth/me", json={"username": "   "})
    assert resp.status_code == 400


async def _memberships(db, user):
    from sqlalchemy import func, select
    from models.course_staff import CourseStaff
    from models.enrollment import Enrollment

    enrolled = (await db.execute(select(func.count()).where(Enrollment.student_id == user.id))).scalar_one()
    staffed = (await db.execute(select(func.count()).where(CourseStaff.user_id == user.id))).scalar_one()
    return enrolled, staffed


async def test_change_role_praktikan_to_asprak_drops_enrollments(client, db):
    from tests.helpers import create_course, enroll_student

    admin = await create_user(db, RoleEnum.SUPERADMIN)
    user = await create_user(db, RoleEnum.PRAKTIKAN)
    await enroll_student(db, await create_course(db), user)
    set_auth(client, admin)

    resp = await client.patch(f"/auth/users/{user.id}/role", json={"role": "asprak"})

    assert resp.status_code == 200, resp.text
    assert "Removed from 1 course membership" in resp.json()["message"]
    await db.refresh(user)
    assert user.role == RoleEnum.ASPRAK
    assert await _memberships(db, user) == (0, 0)


async def test_change_role_asprak_to_praktikan_drops_staff(client, db):
    from tests.helpers import assign_course_staff, create_course

    admin = await create_user(db, RoleEnum.SUPERADMIN)
    user = await create_user(db, RoleEnum.ASPRAK)
    await assign_course_staff(db, await create_course(db), user)
    set_auth(client, admin)

    resp = await client.patch(f"/auth/users/{user.id}/role", json={"role": "praktikan"})

    assert resp.status_code == 200, resp.text
    await db.refresh(user)
    assert user.role == RoleEnum.PRAKTIKAN
    assert await _memberships(db, user) == (0, 0)


async def test_change_own_role_rejected(client, db):
    admin = await create_user(db, RoleEnum.SUPERADMIN)
    set_auth(client, admin)

    resp = await client.patch(f"/auth/users/{admin.id}/role", json={"role": "asprak"})

    assert resp.status_code == 400


async def test_change_role_to_same_role_rejected(client, db):
    admin = await create_user(db, RoleEnum.SUPERADMIN)
    user = await create_user(db, RoleEnum.ASPRAK)
    set_auth(client, admin)

    resp = await client.patch(f"/auth/users/{user.id}/role", json={"role": "asprak"})

    assert resp.status_code == 400
    assert "already" in resp.json()["detail"]


async def test_change_role_requires_superadmin(client, db):
    asprak = await create_user(db, RoleEnum.ASPRAK)
    user = await create_user(db, RoleEnum.PRAKTIKAN)
    set_auth(client, asprak)

    resp = await client.patch(f"/auth/users/{user.id}/role", json={"role": "asprak"})

    assert resp.status_code == 403


async def test_change_role_unknown_user(client, db):
    import uuid

    admin = await create_user(db, RoleEnum.SUPERADMIN)
    set_auth(client, admin)

    resp = await client.patch(f"/auth/users/{uuid.uuid4()}/role", json={"role": "asprak"})

    assert resp.status_code == 404


async def test_force_password_change_applies_to_asprak(client, db):
    user = await create_user(db, RoleEnum.ASPRAK, force_password_change=True)
    set_auth(client, user)

    assert (await client.get("/auth/me")).status_code == 200
    blocked = await client.patch("/auth/me", json={"name": "Asisten"})
    assert blocked.status_code == 403
    assert blocked.json()["detail"] == "Password change required"
