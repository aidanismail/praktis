import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  Announcement,
  AnnouncementComment,
  CreateAnnouncementCommentPayload,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload
} from "../types/announcement.type";

export function listCourseAnnouncements(courseId: string) {
  return apiClient<Announcement[]>(API_ENDPOINTS.announcements.list(courseId), {
    method: "GET"
  });
}

export function createCourseAnnouncement(
  courseId: string,
  payload: CreateAnnouncementPayload
) {
  return apiClient<Announcement>(API_ENDPOINTS.announcements.create(courseId), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateCourseAnnouncement(
  courseId: string,
  announcementId: string,
  payload: UpdateAnnouncementPayload
) {
  return apiClient<Announcement>(
    API_ENDPOINTS.announcements.update(courseId, announcementId),
    {
      method: "PATCH",
      body: JSON.stringify(payload)
    }
  );
}

export function deleteCourseAnnouncement(
  courseId: string,
  announcementId: string
) {
  return apiClient<void>(
    API_ENDPOINTS.announcements.delete(courseId, announcementId),
    { method: "DELETE" }
  );
}

export function addAnnouncementComment(
  courseId: string,
  announcementId: string,
  payload: CreateAnnouncementCommentPayload
) {
  return apiClient<AnnouncementComment>(
    API_ENDPOINTS.announcements.addComment(courseId, announcementId),
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export function deleteAnnouncementComment(
  courseId: string,
  announcementId: string,
  commentId: string
) {
  return apiClient<void>(
    API_ENDPOINTS.announcements.deleteComment(
      courseId,
      announcementId,
      commentId
    ),
    { method: "DELETE" }
  );
}
