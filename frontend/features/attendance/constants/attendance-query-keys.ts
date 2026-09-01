export const attendanceQueryKeys = {
  all: ["attendance"] as const,
  user: (userId: string) => [...attendanceQueryKeys.all, userId] as const,
  session: (userId: string, courseId: string, sessionId: string) =>
    [
      ...attendanceQueryKeys.user(userId),
      "course",
      courseId,
      "session",
      sessionId
    ] as const
};
