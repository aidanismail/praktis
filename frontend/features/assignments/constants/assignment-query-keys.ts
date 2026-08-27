export const assignmentQueryKeys = {
  all: ["assignments"] as const,
  course: (userId: string, courseId: string) =>
    [...assignmentQueryKeys.all, "course", userId, courseId] as const
};
