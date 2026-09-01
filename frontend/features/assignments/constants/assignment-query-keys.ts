export const assignmentQueryKeys = {
  all: ["assignments"] as const,

  course: (userId: string, courseId: string) =>
    [...assignmentQueryKeys.all, "course", userId, courseId] as const,

  detail: (userId: string, courseId: string, assignmentId: string) =>
    [
      ...assignmentQueryKeys.course(userId, courseId),
      "assignment",
      assignmentId
    ] as const,

  submissions: (userId: string, courseId: string, assignmentId: string) =>
    [
      ...assignmentQueryKeys.detail(userId, courseId, assignmentId),
      "submissions"
    ] as const
};
