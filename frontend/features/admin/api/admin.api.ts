import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { Course } from "@/features/courses/types/course.type";
import type { User } from "@/types/user.type";
import type { AdminModuleItem, ImportCsvResponse } from "../types/admin.type";
export type { AdminModuleItem, ImportCsvResponse };

export type ClassSessionItem = {
  id: string;
  course_id: string;
  title: string;
  date: string;
  attendance_status: string;
  grades_published: boolean;
};

export type AttendanceItem = {
  id: string;
  session_id: string;
  student_id: string;
  status: "hadir" | "sakit" | "izin" | "alfa";
  created_at: string;
  recorded_by: string | null;
};

export type StudentItem = {
  id: string;
  username: string;
  email: string;
};

export type StaffItem = {
  id: string;
  username: string;
  email: string;
};

export type AnnouncementCommentItem = {
  id: string;
  announcement_id: string;
  author_id: string;
  author_username: string;
  author_role: string;
  content: string;
  created_at: string;
};

export type AnnouncementItem = {
  id: string;
  course_id: string;
  author_id: string;
  author_username: string;
  author_role: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  comments_count: number;
  comments: AnnouncementCommentItem[];
};

export type SubmissionItem = {
  id: string;
  assignment_id: string;
  student_id: string;
  student_username: string;
  student_email: string | null;
  file_name: string;
  file_size: number;
  download_url: string;
  submitted_at: string;
  is_late: boolean;
  score: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  status: string;
};

export type AssignmentItem = {
  id: string;
  course_id: string;
  session_id: string | null;
  title: string;
  description: string;
  due_date: string | null;
  max_points: number;
  allowed_file_types: string;
  is_published: boolean;
  created_at: string;
  submissions_count: number;
  my_submission: SubmissionItem | null;
};

export async function importStudentsCsv(file: File): Promise<ImportCsvResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient<ImportCsvResponse>(API_ENDPOINTS.auth.importCsv, {
    method: "POST",
    body: formData,
  });
}

export async function fetchAdminUsers(): Promise<User[]> {
  return apiClient<User[]>(API_ENDPOINTS.auth.listUsers);
}

export type CreateAdminUserInput = {
  username: string;
  email: string;
  role: "superadmin" | "asprak" | "praktikan";
  password: string;
};

export async function createAdminUser(data: CreateAdminUserInput): Promise<User> {
  return apiClient<User>(API_ENDPOINTS.auth.createUser, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function resetUserPassword(userId: string, newPassword?: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(API_ENDPOINTS.auth.resetPassword(userId), {
    method: "POST",
    body: JSON.stringify({ new_password: newPassword || null }),
  });
}

export async function fetchAdminModules(): Promise<AdminModuleItem[]> {
  return apiClient<AdminModuleItem[]>(API_ENDPOINTS.modules.list);
}

export async function fetchAdminCourses(): Promise<Course[]> {
  return apiClient<Course[]>(API_ENDPOINTS.courses.list);
}

export async function createCourse(data: {
  code: string;
  name: string;
  academic_year: string;
  semester: string;
}): Promise<Course> {
  return apiClient<Course>(API_ENDPOINTS.courses.create, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCourse(
  courseId: string,
  data: Partial<{
    code: string;
    name: string;
    academic_year: string;
    semester: string;
    is_active: boolean;
  }>
): Promise<Course> {
  return apiClient<Course>(API_ENDPOINTS.courses.update(courseId), {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCourse(courseId: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(API_ENDPOINTS.courses.delete(courseId), {
    method: "DELETE",
  });
}

export async function fetchCourseSessions(courseId: string): Promise<ClassSessionItem[]> {
  return apiClient<ClassSessionItem[]>(API_ENDPOINTS.courses.sessions(courseId));
}

export async function createCourseSession(
  courseId: string,
  data: { title: string; date: string }
): Promise<ClassSessionItem> {
  return apiClient<ClassSessionItem>(API_ENDPOINTS.classSessions.create(courseId), {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchSessionAttendance(sessionId: string): Promise<AttendanceItem[]> {
  return apiClient<AttendanceItem[]>(API_ENDPOINTS.attendance.listBySession(sessionId));
}

export async function fetchCourseStudents(courseId: string): Promise<StudentItem[]> {
  return apiClient<StudentItem[]>(API_ENDPOINTS.courses.students(courseId));
}

export async function fetchCourseStaff(courseId: string): Promise<StaffItem[]> {
  return apiClient<StaffItem[]>(API_ENDPOINTS.courses.staff(courseId));
}

export async function assignCourseStaff(courseId: string, usernames: string[]): Promise<{ message: string }> {
  return apiClient<{ message: string }>(API_ENDPOINTS.courses.staff(courseId), {
    method: "POST",
    body: JSON.stringify({ usernames }),
  });
}

export async function enrollCourseStudents(courseId: string, usernames: string[]): Promise<{ message: string }> {
  return apiClient<{ message: string }>(API_ENDPOINTS.courses.enroll(courseId), {
    method: "POST",
    body: JSON.stringify({ usernames }),
  });
}

export async function unenrollCourseStudent(courseId: string, studentId: string): Promise<void> {
  return apiClient<void>(API_ENDPOINTS.courses.unenroll(courseId, studentId), {
    method: "DELETE",
  });
}

export async function removeCourseStaff(courseId: string, userId: string): Promise<void> {
  return apiClient<void>(API_ENDPOINTS.courses.removeStaff(courseId, userId), {
    method: "DELETE",
  });
}

export async function requestModulePresignedUrl(data: {
  title: string;
  description?: string;
  file_extension: string;
  course_id: string;
}): Promise<{ upload_url: string; file_key: string }> {
  return apiClient<{ upload_url: string; file_key: string }>(API_ENDPOINTS.modules.presignedUrl, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function uploadFileToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to upload file to storage (HTTP ${response.status})`);
  }
}

export async function confirmModuleUpload(data: {
  title: string;
  description?: string;
  file_key: string;
  course_id: string;
}): Promise<{ message: string; id: string }> {
  return apiClient<{ message: string; id: string }>(API_ENDPOINTS.modules.confirm, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createAndUploadModule(
  courseId: string,
  title: string,
  description: string,
  file: File
): Promise<{ message: string; id: string }> {
  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  if (ext !== ".pdf" && ext !== ".docx") {
    throw new Error("Only .pdf and .docx files are allowed.");
  }

  // 1. Request presigned upload URL & save upload intent
  const { upload_url, file_key } = await requestModulePresignedUrl({
    title,
    description: description || undefined,
    file_extension: ext,
    course_id: courseId,
  });

  // 2. Direct binary PUT upload to MinIO/S3
  await uploadFileToPresignedUrl(upload_url, file);

  // 3. Confirm upload and save module record
  return await confirmModuleUpload({
    title,
    description: description || undefined,
    file_key,
    course_id: courseId,
  });
}

export async function publishModule(moduleId: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(API_ENDPOINTS.modules.publish(moduleId), {
    method: "POST",
  });
}

export async function unpublishModule(moduleId: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(API_ENDPOINTS.modules.unpublish(moduleId), {
    method: "POST",
  });
}

export async function deleteModule(moduleId: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(API_ENDPOINTS.modules.delete(moduleId), {
    method: "DELETE",
  });
}

// Announcements API
export async function fetchAnnouncements(courseId: string): Promise<AnnouncementItem[]> {
  return apiClient<AnnouncementItem[]>(API_ENDPOINTS.announcements.list(courseId));
}

export async function createAnnouncement(
  courseId: string,
  data: { title: string; content: string; is_pinned?: boolean }
): Promise<AnnouncementItem> {
  return apiClient<AnnouncementItem>(API_ENDPOINTS.announcements.create(courseId), {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAnnouncement(
  courseId: string,
  announcementId: string,
  data: Partial<{ title: string; content: string; is_pinned: boolean }>
): Promise<AnnouncementItem> {
  return apiClient<AnnouncementItem>(API_ENDPOINTS.announcements.update(courseId, announcementId), {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAnnouncement(courseId: string, announcementId: string): Promise<void> {
  return apiClient<void>(API_ENDPOINTS.announcements.delete(courseId, announcementId), {
    method: "DELETE",
  });
}

export async function addAnnouncementComment(
  courseId: string,
  announcementId: string,
  content: string
): Promise<AnnouncementCommentItem> {
  return apiClient<AnnouncementCommentItem>(API_ENDPOINTS.announcements.addComment(courseId, announcementId), {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function deleteAnnouncementComment(
  courseId: string,
  announcementId: string,
  commentId: string
): Promise<void> {
  return apiClient<void>(API_ENDPOINTS.announcements.deleteComment(courseId, announcementId, commentId), {
    method: "DELETE",
  });
}

// Assignments API
export async function fetchAssignments(courseId: string): Promise<AssignmentItem[]> {
  return apiClient<AssignmentItem[]>(API_ENDPOINTS.assignments.list(courseId));
}

export async function createAssignment(
  courseId: string,
  data: {
    title: string;
    description: string;
    due_date?: string | null;
    max_points?: number;
    allowed_file_types?: string;
    is_published?: boolean;
  }
): Promise<AssignmentItem> {
  return apiClient<AssignmentItem>(API_ENDPOINTS.assignments.create(courseId), {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAssignment(
  courseId: string,
  assignmentId: string,
  data: Partial<{
    title: string;
    description: string;
    due_date: string | null;
    max_points: number;
    allowed_file_types: string;
    is_published: boolean;
  }>
): Promise<AssignmentItem> {
  return apiClient<AssignmentItem>(API_ENDPOINTS.assignments.update(courseId, assignmentId), {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAssignment(courseId: string, assignmentId: string): Promise<void> {
  return apiClient<void>(API_ENDPOINTS.assignments.delete(courseId, assignmentId), {
    method: "DELETE",
  });
}

export async function fetchAssignmentSubmissions(
  courseId: string,
  assignmentId: string
): Promise<SubmissionItem[]> {
  return apiClient<SubmissionItem[]>(API_ENDPOINTS.assignments.submissions(courseId, assignmentId));
}

export async function gradeAssignmentSubmission(
  courseId: string,
  assignmentId: string,
  submissionId: string,
  data: { score: number; feedback?: string }
): Promise<SubmissionItem> {
  return apiClient<SubmissionItem>(API_ENDPOINTS.assignments.grade(courseId, assignmentId, submissionId), {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function openSessionAttendance(sessionId: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(API_ENDPOINTS.classSessions.openAttendance(sessionId), {
    method: "POST",
  });
}

export async function closeSessionAttendance(sessionId: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(API_ENDPOINTS.classSessions.closeAttendance(sessionId), {
    method: "POST",
  });
}

export async function updateSessionAttendance(
  sessionId: string,
  records: { student_id: string; status: "hadir" | "sakit" | "izin" | "alfa" }[]
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(API_ENDPOINTS.attendance.bulkUpdate(sessionId), {
    method: "POST",
    body: JSON.stringify({ records }),
  });
}

export function getGradeExportUrl(sessionId: string, format: "csv" | "xlsx" = "csv"): string {
  return API_ENDPOINTS.export.grades(sessionId, format);
}

export function getAttendanceExportUrl(sessionId: string, format: "csv" | "xlsx" = "csv"): string {
  return API_ENDPOINTS.export.attendance(sessionId, format);
}

export type SystemHealthStatus = {
  status: "ok" | "degraded" | "down";
  db_connected: boolean;
  migrations_current: boolean;
  latency_ms?: number;
};

export async function fetchSystemHealth(): Promise<SystemHealthStatus> {
  const start = performance.now();
  try {
    const res = await apiClient<{
      status: "ok" | "degraded";
      db_connected: boolean;
      migrations_current: boolean;
    }>(API_ENDPOINTS.health, {
      method: "GET",
    });
    const latency_ms = Math.round(performance.now() - start);
    return {
      status: res.status,
      db_connected: res.db_connected,
      migrations_current: res.migrations_current,
      latency_ms,
    };
  } catch {
    const latency_ms = Math.round(performance.now() - start);
    return {
      status: "down",
      db_connected: false,
      migrations_current: false,
      latency_ms,
    };
  }
}
