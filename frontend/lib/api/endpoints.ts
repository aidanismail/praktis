export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    me: "/api/auth/me",

    // Backend still needs to implement this.
    // If Bagas uses a different route, only change this value.
    changePassword: "/api/auth/change-password"
  }
} as const;
