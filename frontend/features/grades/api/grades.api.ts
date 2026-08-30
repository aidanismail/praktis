import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  BulkGradePayload,
  GradeMessageResponse,
  SessionGrade
} from "../types/grade.type";

export function listSessionGrades(sessionId: string) {
  return apiClient<SessionGrade[]>(
    API_ENDPOINTS.grades.listBySession(sessionId),
    { method: "GET" }
  );
}

export function saveSessionGrades(
  sessionId: string,
  payload: BulkGradePayload
) {
  return apiClient<GradeMessageResponse>(
    API_ENDPOINTS.grades.bulkUpdate(sessionId),
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export function publishSessionGrades(sessionId: string) {
  return apiClient<GradeMessageResponse>(
    API_ENDPOINTS.grades.publish(sessionId),
    { method: "POST" }
  );
}

export function unpublishSessionGrades(sessionId: string) {
  return apiClient<GradeMessageResponse>(
    API_ENDPOINTS.grades.unpublish(sessionId),
    { method: "POST" }
  );
}
