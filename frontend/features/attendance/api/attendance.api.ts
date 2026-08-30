import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AttendanceMessageResponse,
  AttendanceRecord,
  BulkAttendancePayload
} from "../types/attendance.type";

export function listSessionAttendance(sessionId: string) {
  return apiClient<AttendanceRecord[]>(
    API_ENDPOINTS.attendance.listBySession(sessionId),
    { method: "GET" }
  );
}

export function saveSessionAttendance(
  sessionId: string,
  payload: BulkAttendancePayload
) {
  return apiClient<AttendanceMessageResponse>(
    API_ENDPOINTS.attendance.bulkUpdate(sessionId),
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}
