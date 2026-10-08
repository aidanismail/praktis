import type { AttendanceStatus } from "../types/attendance.type";

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  alfa: "Alfa",
};

export const ATTENDANCE_STATUS_TEXT_COLORS: Record<AttendanceStatus, string> = {
  hadir: "text-emerald-700 font-semibold",
  sakit: "text-sky-700 font-semibold",
  izin: "text-amber-700 font-semibold",
  alfa: "text-rose-700 font-semibold",
};

export const ATTENDANCE_STATUS_DOT_COLORS: Record<AttendanceStatus, string> = {
  hadir: "bg-emerald-500",
  sakit: "bg-sky-500",
  izin: "bg-amber-500",
  alfa: "bg-rose-500",
};
