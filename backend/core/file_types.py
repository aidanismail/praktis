"""Single source of truth for upload rules shared with the frontend.

The frontend copy (frontend/lib/generated/upload-rules.ts) is generated from this
module by scripts/generate_file_types.py; a test fails when it drifts.
"""

from dataclasses import dataclass

MODULE_MAX_UPLOAD_BYTES_DEFAULT = 25 * 1024 * 1024
ASSIGNMENT_MAX_UPLOAD_BYTES_DEFAULT = 10 * 1024 * 1024
MODULE_TITLE_MAX_LENGTH = 255
MODULE_DESCRIPTION_MAX_LENGTH = 500

DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
ZIP_MAGIC = b"PK\x03\x04"


@dataclass(frozen=True)
class SubmissionFileType:
    extension: str
    label: str
    content_type: str
    magic: bytes | None = None
    is_zip_container: bool = False

    @property
    def accept(self) -> str:
        return f".{self.extension},{self.content_type}"


SUBMISSION_FILE_TYPES: tuple[SubmissionFileType, ...] = (
    SubmissionFileType("pdf", "PDF", "application/pdf", magic=b"%PDF-"),
    SubmissionFileType("zip", "ZIP", "application/zip", magic=ZIP_MAGIC, is_zip_container=True),
    SubmissionFileType("docx", "DOCX", DOCX_CONTENT_TYPE, magic=ZIP_MAGIC, is_zip_container=True),
)

_BY_EXTENSION = {t.extension: t for t in SUBMISSION_FILE_TYPES}


def get_file_type(extension: str) -> SubmissionFileType | None:
    return _BY_EXTENSION.get(extension.lower().lstrip("."))
