"use client";

import { Menu, ChevronRight } from "lucide-react";
import type { User } from "@/types/user.type";
import type { Course } from "@/features/courses/types/course.type";

type DashboardHeaderProps = {
  user: User;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  activeCourse?: Course | null;
  activeAssignmentTitle?: string | null;
  onBackToCourses?: () => void;
  onBackToCourseRoot?: () => void;
  activeTab?: "stream" | "classwork" | "people" | "sessions";
  onSelectTab?: (tab: "stream" | "classwork" | "people" | "sessions") => void;
};

export function DashboardHeader({
  user,
  onToggleSidebar,
  activeCourse,
  activeAssignmentTitle,
  onBackToCourses,
  onBackToCourseRoot,
  activeTab = "stream",
  onSelectTab,
}: DashboardHeaderProps) {
  const initial = user.username.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-xs">
      <div className="flex h-16 w-full items-center gap-5 px-4 sm:px-6">
        {/* Left: Hamburger & Google Classroom Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 apple-press transition-colors shrink-0"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-800 min-w-0">
            <button
              type="button"
              onClick={onBackToCourses}
              className="flex items-center gap-2 font-bold text-slate-900 hover:text-slate-700 apple-press transition-colors shrink-0"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white shadow-xs">
                P
              </div>
              <span className="text-base tracking-tight hidden xs:inline">Praktis</span>
            </button>

            {activeCourse && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                {activeAssignmentTitle ? (
                  <>
                    <button
                      type="button"
                      onClick={onBackToCourseRoot}
                      className="font-medium text-slate-600 hover:text-slate-900 hover:underline truncate max-w-[90px] sm:max-w-[160px] md:max-w-[200px] transition-colors"
                      title="Back to Course Workspace"
                    >
                      {activeCourse.code}
                    </button>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-900 truncate max-w-[100px] sm:max-w-[180px] md:max-w-[240px]">
                      {activeAssignmentTitle}
                    </span>
                  </>
                ) : (
                  <span className="font-semibold text-slate-800 truncate max-w-[130px] sm:max-w-xs md:max-w-md">
                    {activeCourse.code} <span className="hidden sm:inline">— {activeCourse.name}</span>
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Middle: Google Classroom Top-Bar Tabs (Desktop View >= md) */}
        {activeCourse && onSelectTab && !activeAssignmentTitle && (
          <nav className="hidden md:flex items-center gap-1 h-full">
            {[
              { id: "stream", label: "Stream" },
              { id: "classwork", label: "Classwork" },
              { id: "people", label: "People" },
              { id: "sessions", label: "Sessions & Attendance" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id as "stream" | "classwork" | "people" | "sessions")}
                  className={`h-full px-4 text-xs font-semibold border-b-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center relative ${
                    isActive
                      ? "border-slate-900 text-slate-900 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/80"
                  }`}
                >
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full animate-in fade-in zoom-in-95 duration-200" />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right: User Account Chip */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 sm:px-3 py-1.5 text-xs text-slate-700 shadow-xs">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white shrink-0">
              {initial}
            </div>
            <span className="font-semibold text-slate-900 hidden sm:inline">{user.username}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 capitalize">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Header: Scrollable Horizontal Tabs for Course Workspace (< md) */}
      {activeCourse && onSelectTab && !activeAssignmentTitle && (
        <nav className="flex md:hidden items-center border-t border-slate-100 bg-white px-2 overflow-x-auto h-11 w-full shrink-0 gap-1 scrollbar-none">
          {[
            { id: "stream", label: "Stream" },
            { id: "classwork", label: "Classwork" },
            { id: "people", label: "People" },
            { id: "sessions", label: "Sessions & Attendance" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id as "stream" | "classwork" | "people" | "sessions")}
                className={`h-full px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all flex items-center justify-center shrink-0 ${
                  isActive
                    ? "border-slate-900 text-slate-900 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-900 active:bg-slate-50"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}