"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/types/user.type";
import type { Course } from "@/features/courses/types/course.type";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES } from "@/constants/routes";
import { logout } from "@/features/auth/api/auth.api";
import { DASHBOARD_NAVIGATION } from "../constants/dashboard-navigation";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";
import { RoleDashboard } from "./role-dashboard";

type DashboardShellProps = {
  user: User;
};

export function DashboardShell({ user }: DashboardShellProps) {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigationItems = DASHBOARD_NAVIGATION[user.role];

  const [activeItemId, setActiveItemId] = useState(navigationItems[0].id);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Active course & workspace tab state for Google Classroom top bar
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeAssignmentTitle, setActiveAssignmentTitle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"stream" | "classwork" | "people" | "sessions">("stream");

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

  const handleSelectTab = (tab: "stream" | "classwork" | "people" | "sessions") => {
    setActiveTab(tab);
    window.dispatchEvent(new CustomEvent("course-tab-change", { detail: { tab } }));
  };

  const handleBackToCourses = useCallback(() => {
    setActiveCourse(null);
    setActiveAssignmentTitle(null);
    window.dispatchEvent(new CustomEvent("course-workspace-back"));
  }, []);

  const handleBackToCourseRoot = useCallback(() => {
    setActiveAssignmentTitle(null);
    window.dispatchEvent(new CustomEvent("assignment-submissions-back"));
  }, []);

  const handleNavigateToCourse = (courseId: string) => {
    setActiveItemId("courses");
    const params = new URLSearchParams(window.location.search);
    params.set("tab", "courses");
    params.set("courseId", courseId);
    window.history.pushState({}, "", `?${params.toString()}`);
  };

  useEffect(() => {
    const handleWorkspaceChange = (e: Event) => {
      const customEvent = e as CustomEvent<{
        course: Course | null;
        tab?: "stream" | "classwork" | "people" | "sessions";
        assignmentTitle?: string | null;
      }>;
      if (customEvent.detail) {
        setActiveCourse(customEvent.detail.course);
        if (customEvent.detail.tab) {
          setActiveTab(customEvent.detail.tab);
        }
        setActiveAssignmentTitle(customEvent.detail.assignmentTitle || null);
      }
    };

    window.addEventListener("course-workspace-change", handleWorkspaceChange);
    return () => window.removeEventListener("course-workspace-change", handleWorkspaceChange);
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Still clear local auth state even if backend logout fails.
    } finally {
      clearAuth();
      router.replace(ROUTES.login);
      router.refresh();
    }
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
          onSelectItem={(id) => {
            if (activeCourse) handleBackToCourses();
            setActiveItemId(id);
          }}
          onLogout={handleLogout}
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          <div className="mb-5 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {activeCourse ? activeCourse.name : activeItem.label}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {activeCourse
                ? `${activeCourse.code} • Academic Year ${activeCourse.academic_year} (${activeCourse.semester})`
                : activeItem.description}
            </p>
          </div>

          <RoleDashboard
            activeItem={activeItem}
            user={user}
            onNavigateToCourse={handleNavigateToCourse}
          />
        </main>
      </div>
    </div>
  );
}
