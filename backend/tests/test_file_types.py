import importlib.util
from pathlib import Path

import pytest

from core.file_types import SUBMISSION_FILE_TYPES, get_file_type
from services.storage_service import content_type_for

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "generate_file_types.py"


def _load_generator():
    spec = importlib.util.spec_from_file_location("generate_file_types", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_registry_lookup_is_case_and_dot_insensitive():
    assert get_file_type(".PDF") is get_file_type("pdf")
    assert get_file_type("exe") is None


def test_storage_content_types_follow_registry():
    for t in SUBMISSION_FILE_TYPES:
        assert content_type_for(f"a/b/file.{t.extension}") == t.content_type


def test_frontend_constants_match_registry():
    generator = _load_generator()
    if not generator.FRONTEND_FILE.parent.exists():
        pytest.skip("frontend sources are not mounted")
    current = generator.FRONTEND_FILE.read_text(encoding="utf-8").replace("\r\n", "\n")
    assert current == generator.render(), "Run backend/scripts/generate_file_types.py"


def test_module_schemas_reject_oversized_metadata():
    import uuid

    from pydantic import ValidationError

    from core.file_types import MODULE_DESCRIPTION_MAX_LENGTH, MODULE_TITLE_MAX_LENGTH
    from schemas.module import ModuleConfirm, ModuleUpdate

    ok = {"file_key": "a" * 32 + ".pdf", "course_id": uuid.uuid4()}
    ModuleConfirm(title="t" * MODULE_TITLE_MAX_LENGTH, description="d" * MODULE_DESCRIPTION_MAX_LENGTH, **ok)
    with pytest.raises(ValidationError):
        ModuleConfirm(title="t" * (MODULE_TITLE_MAX_LENGTH + 1), **ok)
    with pytest.raises(ValidationError):
        ModuleConfirm(title="t", description="d" * (MODULE_DESCRIPTION_MAX_LENGTH + 1), **ok)
    with pytest.raises(ValidationError):
        ModuleUpdate(description="d" * (MODULE_DESCRIPTION_MAX_LENGTH + 1))
