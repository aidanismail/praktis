import type { UserRole } from "@/types/user.type";

export const ROUTES = {
  login: "/login",
  changePassword: "/change-password",
  dashboard: "/dashboard"
} as const;

export function getDefaultDashboardByRole(role: UserRole) {
  switch (role) {
    case "superadmin":
      return "/dashboard";
    case "asprak":
      return "/dashboard";
    case "praktikan":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}

export function getCourseDetailRoute(courseId: string) {
  return `/dashboard/courses/${encodeURIComponent(courseId)}`;
}
