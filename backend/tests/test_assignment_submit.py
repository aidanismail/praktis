import io
import zipfile
import datetime
from unittest.mock import MagicMock, patch, AsyncMock
import pytest
from sqlalchemy import select
from models.user import RoleEnum
from models.assignment import Assignment, Submission
from tests.helpers import (
    assign_course_staff,
    create_course,
    create_user,
    enroll_student,
    set_auth,
)
from core.rate_limit import _in_memory_limits
from core import cache


def _valid_pdf(size: int = 1024) -> bytes:
    header = b"%PDF-1.4 test content\n"
    return header + b"\x00" * max(0, size - len(header))


def _valid_zip(entry_count: int = 1, entry_size: int = 64) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for i in range(entry_count):
            zf.writestr(f"file_{i}.txt", "x" * entry_size)
    return buf.getvalue()


def _valid_docx() -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("[Content_Types].xml", "<Types/>")
    return buf.getvalue()


def _zip_with_traversal() -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("../../../etc/passwd", "root:x:0:0")
    return buf.getvalue()

@pytest.fixture(autouse=True)
def _mock_storage():
    mock_internal = MagicMock()
    mock_internal.put_object = MagicMock()
    mock_internal.delete_object = MagicMock()

    with patch("api.routers.assignments.storage_service") as mock_svc:
        mock_svc.internal = mock_internal
        mock_svc.bucket_name = "praktis-modules"
        mock_svc.delete_object = AsyncMock()
        mock_svc.generate_presigned_download_url = MagicMock(
            return_value="https://storage.example.com/presigned"
        )
        yield mock_svc


@pytest.fixture(autouse=True)
async def _reset_rate_limit():
    _in_memory_limits.clear()
    if cache.redis_client is not None:
        try:
            keys = await cache.redis_client.keys("rate_limit:assignment_submit:*")
            if keys:
                await cache.redis_client.delete(*keys)
        except Exception:
            pass
    yield
    _in_memory_limits.clear()
    if cache.redis_client is not None:
        try:
            keys = await cache.redis_client.keys("rate_limit:assignment_submit:*")
            if keys:
                await cache.redis_client.delete(*keys)
        except Exception:
            pass


@pytest.fixture
async def _setup(db):
    course = await create_course(db)
    asprak = await create_user(db, RoleEnum.ASPRAK)
    await assign_course_staff(db, course, asprak)
    student = await create_user(db, RoleEnum.PRAKTIKAN)
    await enroll_student(db, course, student)

    assignment = Assignment(
        course_id=course.id,
        title="Upload Test Assignment",
        description="Submit a PDF, ZIP, or DOCX file.",
        max_points=100,
        allowed_file_types="pdf,zip,docx",
        is_published=True,
        created_by=asprak.id,
        due_date=datetime.datetime(2099, 12, 31, tzinfo=datetime.timezone.utc),
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)

    return {
        "course": course,
        "asprak": asprak,
        "student": student,
        "assignment": assignment,
    }


def _submit_url(course_id, assignment_id) -> str:
    return f"/courses/{course_id}/assignments/{assignment_id}/submit"

@pytest.mark.asyncio
async def test_submit_valid_pdf(client, db, _setup):
    s = _setup
    set_auth(client, s["student"])

    content = _valid_pdf(2048)
    resp = await client.post(
        _submit_url(s["course"].id, s["assignment"].id),
        files={"file": ("tugas1.pdf", content, "application/pdf")},
    )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "submitted"
    assert body["is_late"] is False
    assert body["score"] is None
    assert body["file_size"] == len(content)
    assert body["file_name"].endswith(".pdf")
    assert "tugas1" in body["file_name"]


@pytest.mark.asyncio
async def test_submit_valid_zip(client, db, _setup):
    s = _setup
    set_auth(client, s["student"])

    content = _valid_zip()
    resp = await client.post(
        _submit_url(s["course"].id, s["assignment"].id),
        files={"file": ("archive.zip", content, "application/zip")},
    )

    assert resp.status_code == 200, resp.text
    assert resp.json()["file_name"].endswith(".zip")


@pytest.mark.asyncio
async def test_submit_valid_docx(client, db, _setup):
    s = _setup
    set_auth(client, s["student"])

    content = _valid_docx()
    resp = await client.post(
        _submit_url(s["course"].id, s["assignment"].id),
        files={"file": ("report.docx", content, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )

    assert resp.status_code == 200, resp.text
    assert resp.json()["file_name"].endswith(".docx")

@pytest.mark.asyncio
async def test_submit_empty_file(client, db, _setup):
    s = _setup
    set_auth(client, s["student"])

    resp = await client.post(
        _submit_url(s["course"].id, s["assignment"].id),
        files={"file": ("empty.pdf", b"", "application/pdf")},
    )

    assert resp.status_code == 400
    assert "empty" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_submit_over_limit(client, db, _setup):
    s = _setup
    set_auth(client, s["student"])

    over_content = _valid_pdf(10 * 1024 * 1024 + 1)
    resp = await client.post(
        _submit_url(s["course"].id, s["assignment"].id),
        files={"file": ("huge.pdf", over_content, "application/pdf")},
    )

    assert resp.status_code == 400
    assert "exceeds" in resp.json()["detail"].lower() or "size" in resp.json()["detail"].lower()

@pytest.mark.asyncio
async def test_submit_wrong_extension(client, db, _setup):
    s = _setup
    set_auth(client, s["student"])

    resp = await client.post(
        _submit_url(s["course"].id, s["assignment"].id),
        files={"file": ("malware.exe", b"MZ\x90\x00", "application/octet-stream")},
    )

    assert resp.status_code == 400
    assert "not allowed" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_submit_extension_mismatch(client, db, _setup):
    s = _setup
    set_auth(client, s["student"])

    zip_content = _valid_zip()
    resp = await client.post(
        _submit_url(s["course"].id, s["assignment"].id),
        files={"file": ("fake.pdf", zip_content, "application/pdf")},
    )

    assert resp.status_code == 400
    assert "does not match" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_submit_malformed_zip(client, db, _setup):
    s = _setup
    set_auth(client, s["student"])

    fake_zip = b"PK\x03\x04" + b"\xff" * 200
    resp = await client.post(
        _submit_url(s["course"].id, s["assignment"].id),
        files={"file": ("broken.zip", fake_zip, "application/zip")},
    )

    assert resp.status_code == 400
    assert "invalid" in resp.json()["detail"].lower() or "zip" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_submit_zip_path_traversal(client, db, _setup):
    s = _setup
    set_auth(client, s["student"])

    evil_zip = _zip_with_traversal()
    resp = await client.post(
        _submit_url(s["course"].id, s["assignment"].id),
        files={"file": ("traversal.zip", evil_zip, "application/zip")},
    )

    assert resp.status_code == 400
    assert "unsafe" in resp.json()["detail"].lower()

@pytest.mark.asyncio
async def test_submit_unsafe_filename(client, db, _setup):
    s = _setup
    set_auth(client, s["student"])

    long_name = "Ünïcödé_Tügàs_" + "A" * 300 + ".pdf"
    content = _valid_pdf()
    resp = await client.post(
        _submit_url(s["course"].id, s["assignment"].id),
        files={"file": (long_name, content, "application/pdf")},
    )

    assert resp.status_code == 200, resp.text
    returned_name = resp.json()["file_name"]
    assert len(returned_name) <= 200
    assert returned_name.endswith(".pdf")
    assert "ö" not in returned_name
    assert "ü" not in returned_name

@pytest.mark.asyncio
async def test_submit_wrong_role_asprak(client, db, _setup):
    s = _setup
    set_auth(client, s["asprak"])

    resp = await client.post(
        _submit_url(s["course"].id, s["assignment"].id),
        files={"file": ("tugas.pdf", _valid_pdf(), "application/pdf")},
    )

    assert resp.status_code == 403
    assert "only students" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_submit_unenrolled(client, db, _setup):
    s = _setup
    outsider = await create_user(db, RoleEnum.PRAKTIKAN)
    set_auth(client, outsider)

    resp = await client.post(
        _submit_url(s["course"].id, s["assignment"].id),
        files={"file": ("tugas.pdf", _valid_pdf(), "application/pdf")},
    )

    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_submit_draft_assignment(client, db, _setup):
    s = _setup
    set_auth(client, s["student"])

    draft = Assignment(
        course_id=s["course"].id,
        title="Draft Assignment",
        max_points=50,
        allowed_file_types="pdf",
        is_published=False,
        created_by=s["asprak"].id,
    )
    db.add(draft)
    await db.commit()
    await db.refresh(draft)

    resp = await client.post(
        _submit_url(s["course"].id, draft.id),
        files={"file": ("tugas.pdf", _valid_pdf(), "application/pdf")},
    )

    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_submit_wrong_course(client, db, _setup):
    s = _setup
    set_auth(client, s["student"])

    other_course = await create_course(db)
    await enroll_student(db, other_course, s["student"])

    resp = await client.post(
        _submit_url(other_course.id, s["assignment"].id),
        files={"file": ("tugas.pdf", _valid_pdf(), "application/pdf")},
    )

    assert resp.status_code == 404

@pytest.mark.asyncio
async def test_resubmit_clears_grade(client, db, _setup):
    s = _setup
    set_auth(client, s["student"])

    resp1 = await client.post(
        _submit_url(s["course"].id, s["assignment"].id),
        files={"file": ("v1.pdf", _valid_pdf(), "application/pdf")},
    )
    assert resp1.status_code == 200

    sub_res = await db.execute(
        select(Submission).where(
            Submission.assignment_id == s["assignment"].id,
            Submission.student_id == s["student"].id,
        )
    )
    sub = sub_res.scalars().first()
    assert sub is not None
    sub.score = 85.0
    sub.feedback = "Good work"
    sub.graded_by = s["asprak"].id
    sub.graded_at = datetime.datetime.now(datetime.timezone.utc)
    sub.status = "graded"
    await db.commit()

    resp2 = await client.post(
        _submit_url(s["course"].id, s["assignment"].id),
        files={"file": ("v2.pdf", _valid_pdf(2048), "application/pdf")},
    )
    assert resp2.status_code == 200
    body = resp2.json()
    assert body["score"] is None
    assert body["feedback"] is None
    assert body["graded_by"] is None
    assert body["graded_at"] is None
    assert body["status"] == "submitted"

@pytest.mark.asyncio
async def test_submit_late(client, db, _setup):
    s = _setup
    set_auth(client, s["student"])

    s["assignment"].due_date = datetime.datetime(
        2020, 1, 1, tzinfo=datetime.timezone.utc
    )
    await db.commit()

    resp = await client.post(
        _submit_url(s["course"].id, s["assignment"].id),
        files={"file": ("late.pdf", _valid_pdf(), "application/pdf")},
    )

    assert resp.status_code == 200
    assert resp.json()["is_late"] is True


@pytest.mark.asyncio
async def test_submit_on_time(client, db, _setup):
    s = _setup
    set_auth(client, s["student"])

    resp = await client.post(
        _submit_url(s["course"].id, s["assignment"].id),
        files={"file": ("ontime.pdf", _valid_pdf(), "application/pdf")},
    )

    assert resp.status_code == 200
    assert resp.json()["is_late"] is False


@pytest.mark.asyncio
async def test_submit_rate_limiter_triggers_429(client, db, _setup):
    s = _setup
    set_auth(client, s["student"])
    content = _valid_pdf(256)

    for i in range(5):
        resp = await client.post(
            _submit_url(s["course"].id, s["assignment"].id),
            files={"file": (f"attempt_{i}.pdf", content, "application/pdf")},
        )
        assert resp.status_code == 200

    blocked_resp = await client.post(
        _submit_url(s["course"].id, s["assignment"].id),
        files={"file": ("attempt_6.pdf", content, "application/pdf")},
    )
    assert blocked_resp.status_code == 429
    assert "Too many requests" in blocked_resp.json()["detail"]

