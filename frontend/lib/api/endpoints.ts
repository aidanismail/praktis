export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    me: "/api/auth/me",
    changePassword: "/api/auth/change-password"
  },

  courses: {
    list: "/api/courses/",
    students: (courseId: string) => 
      `/api/courses/${encodeURIComponent(courseId)}/students`
  }
} as const;
