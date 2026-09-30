export type ImportCsvResponse = {
  message: string;
  total_rows: number;
  inserted: number;
  skipped_duplicate_username: number;
  skipped_duplicate_email: number;
  invalid_rows: Array<{ row: number; reason: string }>;
};

export type AdminModuleItem = {
  id: string;
  title: string;
  description: string | null;
  file_key: string;
  course_id: string | null;
  uploaded_by: string;
  is_published: boolean;
  created_at: string;
  download_url: string;
};

export type { ClassSessionItem, AttendanceItem, StudentItem, StaffItem } from "../api/admin.api";
