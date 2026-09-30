"use client";

import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import {
  addAnnouncementComment,
  createCourseAnnouncement,
  deleteAnnouncementComment,
  deleteCourseAnnouncement,
  listCourseAnnouncements,
  updateCourseAnnouncement
} from "../api/announcements.api";
import { announcementQueryKeys } from "../constants/announcement-query-keys";
import type {
  CreateAnnouncementCommentPayload,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload
} from "../types/announcement.type";

type CourseAnnouncementScope = {
  userId: string;
  courseId: string;
};

type UseCourseAnnouncementsOptions = CourseAnnouncementScope & {
  enabled: boolean;
};

function shouldRetryList(failureCount: number, error: Error) {
  if (
    error instanceof ApiError &&
    (error.status === 401 || error.status === 403 || error.status === 404)
  ) {
    return false;
  }

  return failureCount < 1;
}

function useInvalidateCourseAnnouncements({
  userId,
  courseId
}: CourseAnnouncementScope) {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({
      queryKey: announcementQueryKeys.course(userId, courseId)
    });
}

export function useCourseAnnouncements({
  userId,
  courseId,
  enabled
}: UseCourseAnnouncementsOptions) {
  return useQuery({
    queryKey: announcementQueryKeys.course(userId, courseId),
    queryFn: () => listCourseAnnouncements(courseId),
    enabled: enabled && userId.length > 0 && courseId.length > 0,
    staleTime: 30_000,
    retry: shouldRetryList
  });
}

export function useCreateCourseAnnouncement(scope: CourseAnnouncementScope) {
  const invalidate = useInvalidateCourseAnnouncements(scope);

  return useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) =>
      createCourseAnnouncement(scope.courseId, payload),
    onSuccess: invalidate,
    retry: false
  });
}

export function useUpdateCourseAnnouncement(scope: CourseAnnouncementScope) {
  const invalidate = useInvalidateCourseAnnouncements(scope);

  return useMutation({
    mutationFn: ({
      announcementId,
      payload
    }: {
      announcementId: string;
      payload: UpdateAnnouncementPayload;
    }) => updateCourseAnnouncement(scope.courseId, announcementId, payload),
    onSuccess: invalidate,
    retry: false
  });
}

export function useDeleteCourseAnnouncement(scope: CourseAnnouncementScope) {
  const invalidate = useInvalidateCourseAnnouncements(scope);

  return useMutation({
    mutationFn: (announcementId: string) =>
      deleteCourseAnnouncement(scope.courseId, announcementId),
    onSuccess: invalidate,
    retry: false
  });
}

export function useAddAnnouncementComment(scope: CourseAnnouncementScope) {
  const invalidate = useInvalidateCourseAnnouncements(scope);

  return useMutation({
    mutationFn: ({
      announcementId,
      payload
    }: {
      announcementId: string;
      payload: CreateAnnouncementCommentPayload;
    }) => addAnnouncementComment(scope.courseId, announcementId, payload),
    onSuccess: invalidate,
    retry: false
  });
}

export function useDeleteAnnouncementComment(scope: CourseAnnouncementScope) {
  const invalidate = useInvalidateCourseAnnouncements(scope);

  return useMutation({
    mutationFn: ({
      announcementId,
      commentId
    }: {
      announcementId: string;
      commentId: string;
    }) =>
      deleteAnnouncementComment(scope.courseId, announcementId, commentId),
    onSuccess: invalidate,
    retry: false
  });
}
