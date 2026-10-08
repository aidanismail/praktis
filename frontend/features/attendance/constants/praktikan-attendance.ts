import type { AttendanceStatus } from "../types/attendance.type";

export {
  ATTENDANCE_STATUS_DOT_COLORS,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_TEXT_COLORS
} from "./attendance-status-styles";

export const ATTENDANCE_STATUS_ORDER: AttendanceStatus[] = ["hadir", "sakit", "izin", "alfa"];
