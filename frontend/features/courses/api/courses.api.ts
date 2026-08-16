import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiClient } from "@/lib/api/client";
import type { Course } from "../types/course.type";
import type { EnrolledStudent } from "../types/enrolled-student.type";

export function listCourses() {
  return apiClient<Course[]>(API_ENDPOINTS.courses.list, {
    method: "GET"
  });
}

export function listCourseStudents(courseId: string) {
  return apiClient<EnrolledStudent[]>(
    API_ENDPOINTS.courses.students(courseId),
    {
      method: "GET"
    }
  );
}
