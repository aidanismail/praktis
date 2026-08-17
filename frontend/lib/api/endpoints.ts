export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    me: "/api/auth/me",
    changePassword: "/api/auth/change-password",
    importCsv: "/api/auth/import-csv",
    listUsers: "/api/auth/users",
    createUser: "/api/auth/users",
    resetPassword: (userId: string) =>
      `/api/auth/users/${encodeURIComponent(userId)}/reset-password`
  },

  courses: {
    list: "/api/courses/",
    create: "/api/courses/",
    detail: (courseId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}`,
    students: (courseId: string) => 
      `/api/courses/${encodeURIComponent(courseId)}/students`,
    sessions: (courseId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/sessions`,
    staff: (courseId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/staff`,
    enroll: (courseId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/enroll`,
    unenroll: (courseId: string, studentId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/students/${encodeURIComponent(studentId)}`,
    removeStaff: (courseId: string, userId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/staff/${encodeURIComponent(userId)}`,
    update: (courseId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}`,
    delete: (courseId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}`
  },

  announcements: {
    list: (courseId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/announcements`,
    create: (courseId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/announcements`,
    update: (courseId: string, announcementId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/announcements/${encodeURIComponent(announcementId)}`,
    delete: (courseId: string, announcementId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/announcements/${encodeURIComponent(announcementId)}`,
    addComment: (courseId: string, announcementId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/announcements/${encodeURIComponent(announcementId)}/comments`,
    deleteComment: (courseId: string, announcementId: string, commentId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/announcements/${encodeURIComponent(announcementId)}/comments/${encodeURIComponent(commentId)}`,
  },

  assignments: {
    list: (courseId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/assignments`,
    create: (courseId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/assignments`,
    detail: (courseId: string, assignmentId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/assignments/${encodeURIComponent(assignmentId)}`,
    update: (courseId: string, assignmentId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/assignments/${encodeURIComponent(assignmentId)}`,
    delete: (courseId: string, assignmentId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/assignments/${encodeURIComponent(assignmentId)}`,
    submissions: (courseId: string, assignmentId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/assignments/${encodeURIComponent(assignmentId)}/submissions`,
    grade: (courseId: string, assignmentId: string, submissionId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/assignments/${encodeURIComponent(assignmentId)}/submissions/${encodeURIComponent(submissionId)}/grade`,
  },

  modules: {
    list: "/api/modules/",
    presignedUrl: "/api/modules/presigned-url",
    confirm: "/api/modules/confirm",
    publish: (moduleId: string) =>
      `/api/modules/${encodeURIComponent(moduleId)}/publish`,
    unpublish: (moduleId: string) =>
      `/api/modules/${encodeURIComponent(moduleId)}/unpublish`,
    delete: (moduleId: string) =>
      `/api/modules/${encodeURIComponent(moduleId)}`
  },

  classSessions: {
    create: (courseId: string) =>
      `/api/courses/${encodeURIComponent(courseId)}/sessions`,
    openAttendance: (sessionId: string) =>
      `/api/class-sessions/${encodeURIComponent(sessionId)}/open-attendance`,
    closeAttendance: (sessionId: string) =>
      `/api/class-sessions/${encodeURIComponent(sessionId)}/close-attendance`
  },

  attendance: {
    listBySession: (sessionId: string) =>
      `/api/attendance/sessions/${encodeURIComponent(sessionId)}`,
    record: (sessionId: string) =>
      `/api/attendance/sessions/${encodeURIComponent(sessionId)}`,
    bulkUpdate: (sessionId: string) =>
      `/api/attendance/sessions/${encodeURIComponent(sessionId)}/bulk`,
  },

  grades: {
    listBySession: (sessionId: string) =>
      `/api/grades/sessions/${encodeURIComponent(sessionId)}`,
    publish: (sessionId: string) =>
      `/api/grades/sessions/${encodeURIComponent(sessionId)}/publish`,
    unpublish: (sessionId: string) =>
      `/api/grades/sessions/${encodeURIComponent(sessionId)}/unpublish`,
  },

  export: {
    attendance: (sessionId: string, format: string = "csv") =>
      `/api/export/attendance/${encodeURIComponent(sessionId)}?format=${format}`,
    grades: (sessionId: string, format: string = "csv") =>
      `/api/export/grades/${encodeURIComponent(sessionId)}?format=${format}`
  },

  health: "/api/health"
} as const;
