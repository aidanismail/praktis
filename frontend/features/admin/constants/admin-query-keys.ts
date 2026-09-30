export const adminQueryKeys = {
  all: ["admin"] as const,
  overview: (userId: string) =>
    [...adminQueryKeys.all, "overview", userId] as const,
  overviewCourses: (userId: string) =>
    [...adminQueryKeys.overview(userId), "courses"] as const,
  overviewUsers: (userId: string) =>
    [...adminQueryKeys.overview(userId), "users"] as const,
  overviewHealth: (userId: string) =>
    [...adminQueryKeys.overview(userId), "health"] as const,
  courses: () => [...adminQueryKeys.all, "courses"] as const,
  users: () => [...adminQueryKeys.all, "users"] as const,
  courseStudents: (courseId: string) =>
    [...adminQueryKeys.all, "courses", courseId, "students"] as const,
  courseStaff: (courseId: string) =>
    [...adminQueryKeys.all, "courses", courseId, "staff"] as const,
  courseSessions: (courseId: string) =>
    [...adminQueryKeys.all, "courses", courseId, "sessions"] as const,
  courseModules: (courseId: string) =>
    [...adminQueryKeys.all, "courses", courseId, "modules"] as const,
  courseAnnouncements: (courseId: string) =>
    [...adminQueryKeys.all, "courses", courseId, "announcements"] as const,
  courseAssignments: (courseId: string) =>
    [...adminQueryKeys.all, "courses", courseId, "assignments"] as const,
  assignmentSubmissions: (courseId: string, assignmentId: string) =>
    [...adminQueryKeys.all, "courses", courseId, "assignments", assignmentId, "submissions"] as const,
  sessionAttendance: (sessionId: string) =>
    [...adminQueryKeys.all, "sessions", sessionId, "attendance"] as const,
};
