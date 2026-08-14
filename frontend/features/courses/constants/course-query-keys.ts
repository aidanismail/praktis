export const courseQueryKeys = {
  all: ["courses"] as const,
  assigned: (userId: string) =>
    [...courseQueryKeys.all, "assigned", userId] as const,
  roster: (userId: string, courseId: string) =>
    [...courseQueryKeys.all, "roster", userId, courseId] as const
};
