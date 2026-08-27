export const adminQueryKeys = {
  all: ["admin"] as const,
  overview: (userId: string) =>
    [...adminQueryKeys.all, "overview", userId] as const,
  overviewCourses: (userId: string) =>
    [...adminQueryKeys.overview(userId), "courses"] as const,
  overviewUsers: (userId: string) =>
    [...adminQueryKeys.overview(userId), "users"] as const,
  overviewHealth: (userId: string) =>
    [...adminQueryKeys.overview(userId), "health"] as const
};
