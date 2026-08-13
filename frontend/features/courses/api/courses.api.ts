import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiClient } from "@/lib/api/client";
import type { Course } from "../types/course.type";

export function listCourses() {
  return apiClient<Course[]>(API_ENDPOINTS.courses.list, {
    method: "GET"
  });
}
