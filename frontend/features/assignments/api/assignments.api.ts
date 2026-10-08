import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

import type {
  Assignment,
  AssignmentSubmission,
  CreateAssignmentPayload,
  GradeSubmissionPayload,
  UpdateAssignmentPayload
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

export function getCourseAssignment(courseId: string, assignmentId: string) {
  return apiClient<Assignment>(
    API_ENDPOINTS.assignments.detail(courseId, assignmentId),
    {
      method: "GET"
    }
  );
}

export function submitCourseAssignment(
  courseId: string,
  assignmentId: string,
  file: File
) {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient<AssignmentSubmission>(
    API_ENDPOINTS.assignments.submit(courseId, assignmentId),
    {
      method: "POST",
      body: formData
    }
  );
}

export function updateCourseAssignment(
  courseId: string,
  assignmentId: string,
  payload: UpdateAssignmentPayload
) {
  return apiClient<Assignment>(
    API_ENDPOINTS.assignments.update(courseId, assignmentId),
    {
      method: "PATCH",
      body: JSON.stringify(payload)
    }
  );
}

export function listAssignmentSubmissions(
  courseId: string,
  assignmentId: string
) {
  return apiClient<AssignmentSubmission[]>(
    API_ENDPOINTS.assignments.submissions(courseId, assignmentId),
    {
      method: "GET"
    }
  );
}

export function gradeAssignmentSubmission(
  courseId: string,
  assignmentId: string,
  submissionId: string,
  payload: GradeSubmissionPayload
) {
  return apiClient<AssignmentSubmission>(
    API_ENDPOINTS.assignments.grade(courseId, assignmentId, submissionId),
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export function setAssignmentGradesPublished(
  courseId: string,
  assignmentId: string,
  published: boolean
) {
  const endpoint = published
    ? API_ENDPOINTS.assignments.publishGrades(courseId, assignmentId)
    : API_ENDPOINTS.assignments.unpublishGrades(courseId, assignmentId);

  return apiClient<Assignment>(endpoint, { method: "POST" });
}

export function deleteCourseAssignment(courseId: string, assignmentId: string) {
  return apiClient<void>(
    API_ENDPOINTS.assignments.delete(courseId, assignmentId),
    {
      method: "DELETE"
    }
  );
}

