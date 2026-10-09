import datetime
import importlib.util
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "cleanup_orphans.py"
NOW = datetime.datetime(2026, 10, 9, 12, 0, tzinfo=datetime.timezone.utc)
OLD = NOW - datetime.timedelta(hours=48)
RECENT = NOW - datetime.timedelta(hours=2)

ORPHAN_KEY = "a" * 32 + ".pdf"
CONFIRMED_KEY = "b" * 32 + ".docx"
RECENT_KEY = "c" * 32 + ".pdf"


@pytest.fixture(scope="module")
def cleanup():
    spec = importlib.util.spec_from_file_location("cleanup_orphans", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_only_old_unconfirmed_module_keys_are_orphans(cleanup):
    objects = [
        (ORPHAN_KEY, OLD),
        (CONFIRMED_KEY, OLD),
        (RECENT_KEY, RECENT),
        ("assignments/x/y/z.pdf", OLD),
        ("banners/x/y.png", OLD),
        ("not-a-module-key.pdf", OLD),
    ]
    orphans = cleanup.find_orphan_keys(objects, {CONFIRMED_KEY}, NOW, datetime.timedelta(hours=24))
    assert orphans == [ORPHAN_KEY]
