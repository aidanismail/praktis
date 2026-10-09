"""Regenerate the frontend upload constants from core/file_types.py.

Run from the backend directory: python scripts/generate_file_types.py
"""

import json
from pathlib import Path

from core.file_types import (
    ASSIGNMENT_MAX_UPLOAD_BYTES_DEFAULT,
    MODULE_DESCRIPTION_MAX_LENGTH,
    MODULE_MAX_UPLOAD_BYTES_DEFAULT,
    MODULE_TITLE_MAX_LENGTH,
    SUBMISSION_FILE_TYPES,
)

FRONTEND_FILE = Path(__file__).resolve().parents[2] / "frontend/lib/generated/upload-rules.ts"


def render() -> str:
    entries = ",\n".join(
        "  {\n"
        f"    id: {json.dumps(t.extension)},\n"
        f"    label: {json.dumps(t.label)},\n"
        f"    accept: {json.dumps(t.accept)},\n"
        "  }"
        for t in SUBMISSION_FILE_TYPES
    )
    return (
        "// Generated from backend/core/file_types.py by backend/scripts/generate_file_types.py.\n"
        "// Edit the backend values and regenerate instead of changing this file.\n"
        f"export const ASSIGNMENT_FILE_TYPE_OPTIONS = [\n{entries},\n] as const;\n"
        "\n"
        f"export const ASSIGNMENT_MAX_UPLOAD_BYTES = {ASSIGNMENT_MAX_UPLOAD_BYTES_DEFAULT};\n"
        f"export const MODULE_MAX_UPLOAD_BYTES = {MODULE_MAX_UPLOAD_BYTES_DEFAULT};\n"
        f"export const MODULE_TITLE_MAX_LENGTH = {MODULE_TITLE_MAX_LENGTH};\n"
        f"export const MODULE_DESCRIPTION_MAX_LENGTH = {MODULE_DESCRIPTION_MAX_LENGTH};\n"
    )


if __name__ == "__main__":
    FRONTEND_FILE.parent.mkdir(parents=True, exist_ok=True)
    FRONTEND_FILE.write_text(render(), encoding="utf-8", newline="\n")
    print(f"Wrote {FRONTEND_FILE}")
