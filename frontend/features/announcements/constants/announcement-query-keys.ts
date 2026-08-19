export const announcementQueryKeys = {
  all: ["announcements"] as const,
  course: (userId: string, courseId: string) =>
    [...announcementQueryKeys.all, "course", userId, courseId] as const
};
