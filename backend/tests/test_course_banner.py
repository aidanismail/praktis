import uuid
import pytest
from models.user import RoleEnum
from tests.helpers import (
    assign_course_staff,
    create_course,
    create_user,
    enroll_student,
    set_auth,
)


@pytest.mark.asyncio
async def test_banner_update_permissions(client, db):
    course = await create_course(db)
    superadmin = await create_user(db, RoleEnum.SUPERADMIN)
    asprak_assigned = await create_user(db, RoleEnum.ASPRAK)
    await assign_course_staff(db, course, asprak_assigned)
    asprak_unassigned = await create_user(db, RoleEnum.ASPRAK)
    student = await create_user(db, RoleEnum.PRAKTIKAN)
    await enroll_student(db, course, student)

    # 1. Assigned Asprak updates banner preset & pattern
    set_auth(client, asprak_assigned)
    resp = await client.patch(
        f"/courses/{course.id}/banner",
        json={
            "banner_theme_id": "ocean",
            "banner_pattern_id": "mesh",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["banner_theme_id"] == "ocean"
    assert data["banner_pattern_id"] == "mesh"

    # 2. Unassigned Asprak attempts to update banner -> 403 Forbidden
    set_auth(client, asprak_unassigned)
    resp_unassigned = await client.patch(
        f"/courses/{course.id}/banner",
        json={"banner_theme_id": "emerald"},
    )
    assert resp_unassigned.status_code == 403

    # 3. Praktikan attempts to update banner -> 403 Forbidden
    set_auth(client, student)
    resp_student_patch = await client.patch(
        f"/courses/{course.id}/banner",
        json={"banner_theme_id": "crimson"},
    )
    assert resp_student_patch.status_code == 403

    # 4. Enrolled Praktikan can view course with banner fields
    resp_student_get = await client.get(f"/courses/{course.id}")
    assert resp_student_get.status_code == 200
    student_course_data = resp_student_get.json()
    assert student_course_data["banner_theme_id"] == "ocean"
    assert student_course_data["banner_pattern_id"] == "mesh"

    # 5. Superadmin can update banner
    set_auth(client, superadmin)
    resp_admin = await client.patch(
        f"/courses/{course.id}/banner",
        json={
            "banner_theme_id": "midnight",
            "banner_pattern_id": "dots",
        },
    )
    assert resp_admin.status_code == 200
    assert resp_admin.json()["banner_theme_id"] == "midnight"
    assert resp_admin.json()["banner_pattern_id"] == "dots"

