export const sessionQueryKeys = {
  all: ["sessions"] as const,
  user: (userId: string) => [...sessionQueryKeys.all, userId] as const,
  course: (userId: string, courseId: string) =>
    [...sessionQueryKeys.user(userId), "course", courseId] as const
};
