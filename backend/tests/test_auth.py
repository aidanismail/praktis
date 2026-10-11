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
