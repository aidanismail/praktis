"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { User } from "@/types/user.type";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { useAdminCourses } from "@/features/admin/hooks/use-admin-courses";
import { useCourseWorkspace } from "@/features/admin/hooks/use-admin-course-workspace";
import { useAssignedCourses } from "@/features/courses/hooks/use-assigned-courses";
import { useEnrolledCourses } from "@/features/courses/hooks/use-enrolled-courses";
import { DASHBOARD_NAVIGATION } from "../constants/dashboard-navigation";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";
import { RoleDashboard } from "./role-dashboard";
import { NotificationBanner } from "@/components/ui/notification-banner";

type DashboardShellProps = {
  user: User;
};

export function DashboardShell({ user }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const logoutMutation = useLogout();
  const navigationItems = DASHBOARD_NAVIGATION[user.role];

  // Active dashboard sidebar tab from URL
  const tabParam = searchParams.get("tab");
  const activeItemId =
    tabParam && navigationItems.some((item) => item.id === tabParam)
      ? tabParam
      : navigationItems[0].id;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Declarative URL parameters for course workspace
  const isSuperadmin = user.role === "superadmin";
  const courseIdParam = searchParams.get("courseId");
  const workspaceTabParam = searchParams.get("workspaceTab");
  const assignmentIdParam = searchParams.get("assignmentId");
  const sessionIdParam = searchParams.get("sessionId");

  // Fetch admin courses for breadcrumb & active course resolution
  const { courses: adminCourses } = useAdminCourses({ enabled: isSuperadmin });
  const { assignments } = useCourseWorkspace(isSuperadmin ? courseIdParam : null);

  // Fetch assigned courses for asprak
  const assignedCoursesQuery = useAssignedCourses(user.id);

  // Fetch enrolled courses for praktikan
  const enrolledCoursesQuery = useEnrolledCourses(user.role === "praktikan" ? user.id : "");

  const activeCourse = useMemo(() => {
    if (!courseIdParam) return null;
    if (isSuperadmin) {
      return adminCourses.find((c) => c.id === courseIdParam) ?? null;
    }
    if (user.role === "asprak") {
      const assignedCourses = assignedCoursesQuery.data ?? [];
      return assignedCourses.find((c) => c.id === courseIdParam) ?? null;
    }
    if (user.role === "praktikan") {
      const enrolledCourses = enrolledCoursesQuery.data ?? [];
      return enrolledCourses.find((c) => c.id === courseIdParam) ?? null;
    }
    return null;
  }, [
    courseIdParam,
    isSuperadmin,
    user.role,
    adminCourses,
    assignedCoursesQuery.data,
    enrolledCoursesQuery.data
  ]);

  const activeTab = useMemo(
    () => workspaceTabParam || "stream",
    [workspaceTabParam]
  );

  const activeAssignmentTitle = useMemo(() => {
    if (assignmentIdParam) {
      if (isSuperadmin) {
        const found = assignments.find((a) => a.id === assignmentIdParam);
        return found ? found.title : "Submissions";
      }
      return "Assignment";
    }
    if (sessionIdParam) {
      return "Session";
    }
    return null;
  }, [isSuperadmin, assignmentIdParam, sessionIdParam, assignments]);

  const activeItem =
    navigationItems.find((item) => item.id === activeItemId) ??
    navigationItems[0];

  const toggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  const handleSelectTab = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("workspaceTab", tab);
      params.delete("assignmentId");
      params.delete("sessionId");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleBackToCourses = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("courseId");
    params.delete("workspaceTab");
    params.delete("assignmentId");
    params.delete("sessionId");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleBackToCourseRoot = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("assignmentId");
    params.delete("sessionId");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleSelectNavigationItem = useCallback(
    (id: string) => {
      setIsMobileSidebarOpen(false);
      const params = new URLSearchParams();
      params.set("tab", id);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router]
  );

  const handleNavigateToCourse = useCallback(
    (courseId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", user.role === "superadmin" ? "courses" : "classes");
      params.set("courseId", courseId);
      params.set("workspaceTab", "stream");
      params.delete("assignmentId");
      params.delete("sessionId");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams, user.role]
  );

  function handleLogout() {
    logoutMutation.mutate();
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 flex flex-col">
      {/* 1. Global Full-Width Google Classroom Top App Bar */}
      <DashboardHeader
        user={user}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        activeCourse={activeCourse}
        activeAssignmentTitle={activeAssignmentTitle}
        onBackToCourses={handleBackToCourses}
        onBackToCourseRoot={handleBackToCourseRoot}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onLogout={handleLogout}
      />

      {/* 2. Main Body with Sidebar & Content */}
      <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
        <DashboardSidebar
          items={navigationItems}
          activeItemId={activeItemId}
          onSelectItem={handleSelectNavigationItem}
          onLogout={handleLogout}
          isLoggingOut={logoutMutation.isPending}
          hasLogoutError={logoutMutation.isError}
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          {logoutMutation.isError ? (
            <div id="logout-error-message" className="mb-5">
              <NotificationBanner
                variant="error"
                onClose={() => logoutMutation.reset()}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div>
                    <span className="font-semibold text-white">Sign out could not be confirmed: </span>
                    <span className="text-slate-300">Your server session is still active. Check your connection and try signing out again.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="inline-flex items-center rounded-lg bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 transition disabled:opacity-60 shrink-0"
                  >
                    Try again
                  </button>
                </div>
              </NotificationBanner>
            </div>
          ) : null}

          <RoleDashboard
            activeItem={activeItem}
            user={user}
            onNavigateToCourse={handleNavigateToCourse}
            onNavigateToNavItem={handleSelectNavigationItem}
            activeCourse={activeCourse}
            workspaceTab={activeTab}
            assignmentId={assignmentIdParam}
            sessionId={sessionIdParam}
          />
        </main>
      </div>
    </div>
  );
}
