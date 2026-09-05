"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { User } from "@/types/user.type";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { useAdminCourses } from "@/features/admin/hooks/use-admin-courses";
import { useCourseWorkspace } from "@/features/admin/hooks/use-admin-course-workspace";
import { DASHBOARD_NAVIGATION } from "../constants/dashboard-navigation";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";
import { RoleDashboard } from "./role-dashboard";

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

  // Fetch admin courses for breadcrumb & active course resolution
  const { courses } = useAdminCourses();
  const { assignments } = useCourseWorkspace(isSuperadmin ? courseIdParam : null);

  const activeCourse = useMemo(
    () =>
      isSuperadmin && courseIdParam
        ? courses.find((c) => c.id === courseIdParam) ?? null
        : null,
    [isSuperadmin, courseIdParam, courses]
  );

  const activeTab = useMemo(
    () =>
      (workspaceTabParam as "stream" | "classwork" | "people" | "sessions") ||
      "stream",
    [workspaceTabParam]
  );

  const activeAssignmentTitle = useMemo(() => {
    if (!isSuperadmin || !assignmentIdParam) return null;
    const found = assignments.find((a) => a.id === assignmentIdParam);
    return found ? found.title : "Submissions";
  }, [isSuperadmin, assignmentIdParam, assignments]);

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
    (tab: "stream" | "classwork" | "people" | "sessions") => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("workspaceTab", tab);
      params.delete("assignmentId");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleBackToCourses = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("courseId");
    params.delete("workspaceTab");
    params.delete("assignmentId");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleBackToCourseRoot = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("assignmentId");
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
      params.set("tab", "courses");
      params.set("courseId", courseId);
      params.set("workspaceTab", "stream");
      params.delete("assignmentId");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
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
            <div
              id="logout-error-message"
              role="alert"
              className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4
                text-red-950"
            >
              <h2 className="text-sm font-semibold">
                Sign out could not be confirmed
              </h2>

              <p className="mt-1 text-sm leading-6 text-red-800">
                Your server session is still active. Check your connection and
                try signing out again.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Try again
                </button>

                <button
                  type="button"
                  onClick={() => logoutMutation.reset()}
                  className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-900 transition hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : null}

          {!activeCourse && (
            <div className="mb-5 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {activeItem.label}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {activeItem.description}
              </p>
            </div>
          )}

          <RoleDashboard
            activeItem={activeItem}
            user={user}
            onNavigateToCourse={handleNavigateToCourse}
            onNavigateToNavItem={handleSelectNavigationItem}
          />
        </main>
      </div>
    </div>
  );
}
