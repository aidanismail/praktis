export const moduleQueryKeys = {
  all: ["modules"] as const,
  course: (userId: string, courseId: string) =>
    [...moduleQueryKeys.all, "course", userId, courseId] as const
};
