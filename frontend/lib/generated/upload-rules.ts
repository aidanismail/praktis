// Generated from backend/core/file_types.py by backend/scripts/generate_file_types.py.
// Edit the backend values and regenerate instead of changing this file.
export const ASSIGNMENT_FILE_TYPE_OPTIONS = [
  {
    id: "pdf",
    label: "PDF",
    accept: ".pdf,application/pdf",
  },
  {
    id: "zip",
    label: "ZIP",
    accept: ".zip,application/zip",
  },
  {
    id: "docx",
    label: "DOCX",
    accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
] as const;

export const ASSIGNMENT_MAX_UPLOAD_BYTES = 10485760;
export const MODULE_MAX_UPLOAD_BYTES = 26214400;
export const MODULE_TITLE_MAX_LENGTH = 255;
export const MODULE_DESCRIPTION_MAX_LENGTH = 500;
