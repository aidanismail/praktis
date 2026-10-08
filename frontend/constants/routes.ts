import type { UserRole } from "@/types/user.type";

export const ROUTES = {
  login: "/login",
  changePassword: "/change-password",
  dashboard: "/dashboard"
} as const;

export const COURSE_WORKSPACE_TABS = [
  "stream",
  "modules",
  "assignments",
  "people",
  "sessions"
] as const;

export type CourseWorkspaceTab = (typeof COURSE_WORKSPACE_TABS)[number];

/** Workspace tabs available to superadmin (assignments live under "classwork"). */
export const ADMIN_WORKSPACE_TABS = [
  "stream",
  "classwork",
  "people",
  "sessions"
] as const;

export type AdminWorkspaceTab = (typeof ADMIN_WORKSPACE_TABS)[number];

export function parseCourseWorkspaceTab(
  value: string | undefined
): CourseWorkspaceTab {
  if (value === "classwork") {
    return "assignments";
  }

  if (
    value === "stream" ||
    value === "modules" ||
    value === "assignments" ||
    value === "people" ||
    value === "sessions"
  ) {
    return value;
  }

  return "stream";
}

/**
 * Normalizes a workspaceTab URL value to one the given role can actually open.
 * Unknown values fall back to "stream".
 */
export function resolveWorkspaceTabForRole(
  role: UserRole | undefined,
  value: string | null | undefined
): string {
  if (role === "superadmin") {
    if (value === "modules" || value === "assignments") {
      return "classwork";
    }

    return (ADMIN_WORKSPACE_TABS as readonly string[]).includes(value ?? "")
      ? (value as AdminWorkspaceTab)
      : "stream";
  }

  return parseCourseWorkspaceTab(value ?? undefined);
}

/** Dashboard navigation tab that hosts the course workspace for a role. */
export function getCourseNavTabForRole(role?: UserRole): "courses" | "classes" {
  return role === "superadmin" ? "courses" : "classes";
}

type DashboardCourseRouteOptions = {
  role?: UserRole;
  workspaceTab?: string;
  assignmentId?: string;
  sessionId?: string;
};

function buildDashboardCourseRoute(
  courseId: string,
  {
    role,
    workspaceTab = "stream",
    assignmentId,
    sessionId
  }: DashboardCourseRouteOptions
) {
  const params = new URLSearchParams();
  params.set("tab", getCourseNavTabForRole(role));
  params.set("courseId", courseId);
  params.set("workspaceTab", resolveWorkspaceTabForRole(role, workspaceTab));
  if (assignmentId) params.set("assignmentId", assignmentId);
  if (sessionId) params.set("sessionId", sessionId);

  return `${ROUTES.dashboard}?${params.toString()}`;
}

export function getCourseDetailRoute(
  courseId: string,
  tab?: string,
  role?: UserRole
) {
  return buildDashboardCourseRoute(courseId, { role, workspaceTab: tab });
}

export function getAssignmentDetailRoute(
  courseId: string,
  assignmentId: string,
  role?: UserRole
) {
  return buildDashboardCourseRoute(courseId, {
    role,
    workspaceTab: "assignments",
    assignmentId
  });
}

export function getSessionDetailRoute(
  courseId: string,
  sessionId: string,
  role?: UserRole
) {
  return buildDashboardCourseRoute(courseId, {
    role,
    workspaceTab: "sessions",
    sessionId
  });
}
