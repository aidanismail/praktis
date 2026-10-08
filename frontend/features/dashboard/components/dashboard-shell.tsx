"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { User } from "@/types/user.type";
import { resolveWorkspaceTabForRole } from "@/constants/routes";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { useAdminCourses } from "@/features/admin/hooks/use-admin-courses";
import { useCourseWorkspace } from "@/features/admin/hooks/use-admin-course-workspace";
import { useAssignedCourses } from "@/features/courses/hooks/use-assigned-courses";
import { useEnrolledCourses } from "@/features/courses/hooks/use-enrolled-courses";
import { useAssignmentDetail } from "@/features/assignments/hooks/use-course-assignments";
import { useCourseSessions } from "@/features/sessions/hooks/use-course-sessions";
import { DASHBOARD_NAVIGATION } from "../constants/dashboard-navigation";
import { DashboardHeader } from "./dashboard-header";
import {
  DashboardSidebar,
  DESKTOP_SIDEBAR_ID,
  MOBILE_SIDEBAR_ID
} from "./dashboard-sidebar";
import { CourseLookupState } from "./course-lookup-state";
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

  const rawTabParam = searchParams.get("tab");
  // "attendace" is a legacy misspelling that may still exist in old links.
  const tabParam = rawTabParam === "attendace" ? "attendance" : rawTabParam;
  const activeItemId =
    tabParam && navigationItems.some((item) => item.id === tabParam)
      ? tabParam
      : navigationItems[0].id;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarRequested, setIsMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  // The drawer only exists below md; never keep it (or its scroll lock) open on desktop.
  const isMobileSidebarOpen = isMobile && isMobileSidebarRequested;

  const isSuperadmin = user.role === "superadmin";
  const isAsprak = user.role === "asprak";
  const isPraktikan = user.role === "praktikan";
  const courseNavItemId = isSuperadmin ? "courses" : "classes";

  const courseIdParam = searchParams.get("courseId");
  const workspaceTabParam = searchParams.get("workspaceTab");
  const assignmentIdParam = searchParams.get("assignmentId");
  const sessionIdParam = searchParams.get("sessionId");

  const {
    courses: adminCourses,
    isLoading: isAdminCoursesLoading,
    error: adminCoursesError,
    refetch: refetchAdminCourses
  } = useAdminCourses({ enabled: isSuperadmin });
  const { assignments } = useCourseWorkspace(isSuperadmin ? courseIdParam : null);

  // Each role only loads its own course list (an empty id disables the query).
  const assignedCoursesQuery = useAssignedCourses(isAsprak ? user.id : "");
  const enrolledCoursesQuery = useEnrolledCourses(isPraktikan ? user.id : "");

  const assignmentDetailQuery = useAssignmentDetail({
    userId: user.id,
    courseId: courseIdParam ?? "",
    assignmentId: assignmentIdParam ?? "",
    enabled: !isSuperadmin && Boolean(courseIdParam && assignmentIdParam),
  });

  const sessionsQuery = useCourseSessions({
    userId: user.id,
    courseId: courseIdParam ?? "",
    enabled: !isSuperadmin && Boolean(courseIdParam && sessionIdParam),
  });

  const activeItem =
    navigationItems.find((item) => item.id === activeItemId) ??
    navigationItems[0];

  // The course workspace only lives on the role's course tab.
  const isCourseTab = activeItem.id === courseNavItemId;

  const activeCourse = useMemo(() => {
    if (!courseIdParam || !isCourseTab) return null;
    if (isSuperadmin) {
      return adminCourses.find((c) => c.id === courseIdParam) ?? null;
    }
    if (isAsprak) {
      const assignedCourses = assignedCoursesQuery.data ?? [];
      return assignedCourses.find((c) => c.id === courseIdParam) ?? null;
    }
    if (isPraktikan) {
      const enrolledCourses = enrolledCoursesQuery.data ?? [];
      return enrolledCourses.find((c) => c.id === courseIdParam) ?? null;
    }
    return null;
  }, [
    courseIdParam,
    isCourseTab,
    isSuperadmin,
    isAsprak,
    isPraktikan,
    adminCourses,
    assignedCoursesQuery.data,
    enrolledCoursesQuery.data
  ]);

  const activeTab = useMemo(
    () => resolveWorkspaceTabForRole(user.role, workspaceTabParam),
    [user.role, workspaceTabParam]
  );

  // Deep links: distinguish "still loading" from "not found / no access".
  const courseLookupStatus: "loading" | "error" | "missing" | null = (() => {
    if (!courseIdParam || !isCourseTab || activeCourse) return null;
    if (isSuperadmin) {
      if (isAdminCoursesLoading) return "loading";
      return adminCoursesError ? "error" : "missing";
    }
    const query = isAsprak ? assignedCoursesQuery : enrolledCoursesQuery;
    if (query.isPending) return "loading";
    return query.isError ? "error" : "missing";
  })();

  function retryCourseLookup() {
    if (isSuperadmin) {
      void refetchAdminCourses();
    } else if (isAsprak) {
      void assignedCoursesQuery.refetch();
    } else {
      void enrolledCoursesQuery.refetch();
    }
  }

  const activeAssignmentTitle = useMemo(() => {
    if (assignmentIdParam) {
      if (isSuperadmin) {
        const found = assignments.find((a) => a.id === assignmentIdParam);
        return found ? found.title : "Submissions";
      }
      return assignmentDetailQuery.data?.title ?? "Assignment";
    }
    if (sessionIdParam) {
      const found = sessionsQuery.data?.find((s) => s.id === sessionIdParam);
      return found ? found.title : "Session";
    }
    return null;
  }, [
    isSuperadmin,
    assignmentIdParam,
    sessionIdParam,
    assignments,
    assignmentDetailQuery.data?.title,
    sessionsQuery.data,
  ]);

  const toggleSidebar = () => {
    if (isMobile) {
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
      params.set("tab", courseNavItemId);
      params.set("courseId", courseId);
      params.set("workspaceTab", "stream");
      params.delete("assignmentId");
      params.delete("sessionId");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [courseNavItemId, pathname, router, searchParams]
  );

  function handleLogout() {
    logoutMutation.mutate();
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>
      <DashboardHeader
        user={user}
        isSidebarExpanded={isMobile ? isMobileSidebarOpen : !isSidebarCollapsed}
        sidebarControlsId={isMobile ? MOBILE_SIDEBAR_ID : DESKTOP_SIDEBAR_ID}
        onToggleSidebar={toggleSidebar}
        activeCourse={activeCourse}
        activeAssignmentTitle={activeAssignmentTitle}
        onBackToCourses={handleBackToCourses}
        onBackToCourseRoot={handleBackToCourseRoot}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onLogout={handleLogout}
      />

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

        <main id="main-content" tabIndex={-1} className={`outline-none flex-1 min-w-0 p-3 sm:p-6 lg:p-8 mx-auto w-full ${activeCourse ? "max-w-6xl" : "max-w-5xl"}`}>
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

          {!activeCourse && activeItem.id !== "classes" && activeItem.id !== "courses" && (
            <div className="mb-5 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {activeItem.label}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {activeItem.description}
              </p>
            </div>
          )}
          {courseLookupStatus ? (
            <CourseLookupState
              status={courseLookupStatus}
              onBack={handleBackToCourses}
              onRetry={retryCourseLookup}
            />
          ) : (
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
          )}
        </main>
      </div>
    </div>
  );
}
