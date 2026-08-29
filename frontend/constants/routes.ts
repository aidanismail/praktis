import type { UserRole } from "@/types/user.type";

export const ROUTES = {
  login: "/login",
  changePassword: "/change-password",
  dashboard: "/dashboard"
} as const;

export const COURSE_WORKSPACE_TABS = ["stream", "classwork", "people"] as const;

export type CourseWorkspaceTab = (typeof COURSE_WORKSPACE_TABS)[number];

export function parseCourseWorkspaceTab(
  value: string | undefined
): CourseWorkspaceTab {
  if (value === "stream" || value === "classwork" || value === "people") {
    return value;
  }

  return "stream";
}

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

export function getCourseDetailRoute(
  courseId: string,
  tab?: CourseWorkspaceTab
) {
  const route = `/dashboard/courses/${encodeURIComponent(courseId)}`;

  return tab ? `${route}?tab=${encodeURIComponent(tab)}` : route;
}

export function getAssignmentDetailRoute(
  courseId: string,
  assignmentId: string
) {
  return `/dashboard/courses/${encodeURIComponent(
    courseId
  )}/assignments/${encodeURIComponent(assignmentId)}`;
}
