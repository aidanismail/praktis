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
