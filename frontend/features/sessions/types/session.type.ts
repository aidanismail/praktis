export const SESSION_ATTENDANCE_STATUSES = [
  "SCHEDULED",
  "OPEN",
  "CLOSED"
] as const;

export type SessionAttendanceStatus =
  (typeof SESSION_ATTENDANCE_STATUSES)[number];

export type SessionAttendanceStatusView =
  | SessionAttendanceStatus
  | "UNKNOWN";

export type CourseSession = {
  id: string;
  course_id: string;
  title: string;
  date: string;
  attendance_status: string;
  grades_published: boolean;
  grades_published_at: string | null;
  grades_published_by: string | null;
};

export type CreateCourseSessionPayload = {
  title: string;
  date: string;
};

export type UpdateCourseSessionPayload = Partial<CreateCourseSessionPayload>;

export type SessionMessageResponse = {
  message: string;
};

export function getSessionAttendanceStatus(
  value: string
): SessionAttendanceStatusView {
  return SESSION_ATTENDANCE_STATUSES.includes(
    value as SessionAttendanceStatus
  )
    ? (value as SessionAttendanceStatus)
    : "UNKNOWN";
}
