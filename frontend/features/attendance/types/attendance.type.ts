export const ATTENDANCE_STATUSES = ["hadir", "sakit", "izin", "alfa"] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
export type AttendanceSelection = AttendanceStatus | "";

export type AttendanceRecord = {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
  recorded_by: string | null;
};

export type AttendanceUpdate = {
  student_id: string;
  status: AttendanceStatus;
};

export type BulkAttendancePayload = {
  records: AttendanceUpdate[];
};

export type AttendanceMessageResponse = {
  message: string;
};
