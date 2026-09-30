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

export type UpdateCourseBannerPayload = {
  banner_theme_id?: string | null;
  banner_pattern_id?: string | null;
  banner_image_url?: string | null;
};

export function updateCourseBanner(
  courseId: string,
  payload: UpdateCourseBannerPayload
) {
  return apiClient<Course>(API_ENDPOINTS.courses.banner(courseId), {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function uploadCourseBannerImage(courseId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient<Course>(API_ENDPOINTS.courses.bannerImage(courseId), {
    method: "POST",
    body: formData
  });
}

export function deleteCourseBannerImage(courseId: string) {
  return apiClient<Course>(API_ENDPOINTS.courses.bannerImage(courseId), {
    method: "DELETE"
  });
}

