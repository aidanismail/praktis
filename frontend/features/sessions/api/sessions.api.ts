import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiClient } from "@/lib/api/client";
import type {
  CourseSession,
  CreateCourseSessionPayload,
  SessionMessageResponse,
  UpdateCourseSessionPayload
} from "../types/session.type";

export function listCourseSessions(courseId: string) {
  return apiClient<CourseSession[]>(API_ENDPOINTS.courses.sessions(courseId), {
    method: "GET"
  });
}

export function createCourseSession(
  courseId: string,
  payload: CreateCourseSessionPayload
) {
  return apiClient<CourseSession>(API_ENDPOINTS.classSessions.create(courseId), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateCourseSession(
  sessionId: string,
  payload: UpdateCourseSessionPayload
) {
  return apiClient<CourseSession>(API_ENDPOINTS.classSessions.update(sessionId), {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function openSessionAttendance(sessionId: string) {
  return apiClient<SessionMessageResponse>(
    API_ENDPOINTS.classSessions.openAttendance(sessionId),
    { method: "POST" }
  );
}

export function closeSessionAttendance(sessionId: string) {
  return apiClient<SessionMessageResponse>(
    API_ENDPOINTS.classSessions.closeAttendance(sessionId),
    { method: "POST" }
  );
}
