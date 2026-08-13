export const courseQueryKeys = {
  all: ["courses"] as const,
  assigned: (userId: string) =>
    [...courseQueryKeys.all, "assigned", userId] as const
};
