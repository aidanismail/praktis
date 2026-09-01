export const gradeQueryKeys = {
  all: ["session-grades"] as const,
  user: (userId: string) => [...gradeQueryKeys.all, userId] as const,
  personal: (userId: string) =>
    [...gradeQueryKeys.user(userId), "personal"] as const,
  session: (userId: string, courseId: string, sessionId: string) =>
    [
      ...gradeQueryKeys.user(userId),
      "course",
      courseId,
      "session",
      sessionId
    ] as const
};
