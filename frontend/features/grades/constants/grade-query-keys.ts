export const gradeQueryKeys = {
  all: ["grades"] as const,
  user: (userId: string) => [...gradeQueryKeys.all, userId] as const,
  personal: (userId: string) =>
    [...gradeQueryKeys.user(userId), "personal"] as const
};
