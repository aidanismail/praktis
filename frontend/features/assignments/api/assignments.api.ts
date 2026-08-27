import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

import type {
  Assignment,
  CreateAssignmentPayload
} from "../types/assignment.type";

export function listCourseAssignments(courseId: string) {
  return apiClient<Assignment[]>(API_ENDPOINTS.assignments.list(courseId), {
    method: "GET"
  });
}

export function createCourseAssignment(
  courseId: string,
  payload: CreateAssignmentPayload
) {
  return apiClient<Assignment>(API_ENDPOINTS.assignments.create(courseId), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
