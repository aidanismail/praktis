import io

from openpyxl import Workbook

from core.config import settings
from models.user import RoleEnum

from tests.helpers import create_user, set_auth


def _csv_file(rows: list[tuple[str, str]], header: str = "npm,email") -> tuple[str, bytes, str]:
    body = header + "\n" + "\n".join(f"{npm},{email}" for npm, email in rows)
    return ("students.csv", body.encode(), "text/csv")


def _xlsx_file(rows: list[tuple[str, str]]) -> tuple[str, bytes, str]:
    wb = Workbook()
    ws = wb.active
    ws.append(["npm", "email"])
    for npm, email in rows:
        ws.append([npm, email])
    buf = io.BytesIO()
    wb.save(buf)
    return (
        "students.xlsx",
        buf.getvalue(),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


async def _import(client, file):
    return await client.post("/auth/import-csv", files={"file": file})


async def test_import_csv_happy_path(client, db):
    admin = await create_user(db, RoleEnum.SUPERADMIN)
    set_auth(client, admin)

    resp = await _import(client, _csv_file([("140810220001", "a@example.com"), ("140810220002", "b@example.com")]))
    assert resp.status_code == 200
    body = resp.json()
    assert body["inserted"] == 2
    assert body["invalid_rows"] == []

    login = await client.post(
        "/auth/login", json={"username": "140810220001", "password": "Praktis140810220001"}
    )
    assert login.status_code == 200


async def test_import_xlsx_happy_path(client, db):
    admin = await create_user(db, RoleEnum.SUPERADMIN)
    set_auth(client, admin)

    resp = await _import(client, _xlsx_file([("140810220003", "c@example.com")]))
    assert resp.status_code == 200
    assert resp.json()["inserted"] == 1


async def test_import_duplicate_email_counted_not_error(client, db):
    admin = await create_user(db, RoleEnum.SUPERADMIN)
    existing = await create_user(db, RoleEnum.PRAKTIKAN)
    set_auth(client, admin)

    resp = await _import(
        client,
        _csv_file([
            ("140810220004", existing.email),
            ("140810220005", "fresh@example.com"),
        ]),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["inserted"] == 1
    assert body["skipped_duplicate_email"] == 1


async def test_import_duplicate_username_counted(client, db):
    admin = await create_user(db, RoleEnum.SUPERADMIN)
    set_auth(client, admin)

    first = await _import(client, _csv_file([("140810220006", "x@example.com")]))
    assert first.json()["inserted"] == 1

    resp = await _import(client, _csv_file([("140810220006", "y@example.com")]))
    assert resp.json()["inserted"] == 0
    assert resp.json()["skipped_duplicate_username"] == 1


async def test_import_invalid_rows_reported(client, db):
    admin = await create_user(db, RoleEnum.SUPERADMIN)
    set_auth(client, admin)

    resp = await _import(
        client,
        _csv_file([
            ("notanpm", "a@example.com"),
            ("140810220007", "not-an-email"),
            ("140810220008", "ok@example.com"),
        ]),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["inserted"] == 1
    assert len(body["invalid_rows"]) == 2
    assert body["invalid_rows"][0]["row"] == 1


async def test_import_missing_columns_400(client, db):
    admin = await create_user(db, RoleEnum.SUPERADMIN)
    set_auth(client, admin)

    resp = await _import(client, ("students.csv", b"name,email\nfoo,a@example.com", "text/csv"))
    assert resp.status_code == 400


async def test_import_wrong_extension_400(client, db):
    admin = await create_user(db, RoleEnum.SUPERADMIN)
    set_auth(client, admin)

    resp = await _import(client, ("students.txt", b"npm,email\n1,a@b.c", "text/plain"))
    assert resp.status_code == 400


async def test_import_oversize_413(client, db, monkeypatch):
    admin = await create_user(db, RoleEnum.SUPERADMIN)
    set_auth(client, admin)

    monkeypatch.setattr(settings, "IMPORT_MAX_BYTES", 100)
    resp = await _import(client, _csv_file([("140810220009", "z@example.com")] * 20))
    assert resp.status_code == 413


async def test_import_requires_superadmin(client, db):
    asprak = await create_user(db, RoleEnum.ASPRAK)
    set_auth(client, asprak)

    resp = await _import(client, _csv_file([("140810220010", "q@example.com")]))
    assert resp.status_code == 403
