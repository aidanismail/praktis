"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  CalendarBlank,
  ArrowLeft,
  ChatCircle,
  BookOpen,
  ClipboardText,
  Users,
  GraduationCap,
} from "@phosphor-icons/react";
import type { Course } from "@/features/courses/types/course.type";
import type { User } from "@/types/user.type";
import { CourseStream } from "@/features/announcements/components/course-stream";
import { CourseUpcomingWidget } from "./course-upcoming-widget";
import { CourseModules } from "@/features/modules/components/course-modules";
import { CourseAssignments } from "@/features/assignments/components/course-assignments";
import { PraktikanAssignmentDetailPage } from "@/features/assignments/components/praktikan-assignment-detail-page";
import { PraktikanCourseMembership } from "./praktikan-course-membership";
import { PraktikanCourseAttendance } from "@/features/attendance/components/praktikan-course-attendance";
import { PraktikanCourseGrades } from "@/features/grades/components/praktikan-course-grades";
import {
  getThemeConfig,
  getPatternConfig,
  getCourseBannerTheme,
} from "../constants/banner-themes";

export type PraktikanWorkspaceTab =
  | "stream"
  | "modules"
  | "assignments"
  | "people"
  | "sessions";

const WORKSPACE_TABS: {
  id: PraktikanWorkspaceTab;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "stream", label: "Stream", icon: ChatCircle },
  { id: "modules", label: "Modules", icon: BookOpen },
  { id: "assignments", label: "Assignments", icon: ClipboardText },
  { id: "people", label: "People", icon: Users },
  { id: "sessions", label: "Attendance & Grades", icon: GraduationCap },
];

type PraktikanCourseWorkspaceProps = {
  user: User;
  course: Course;
  workspaceTab: PraktikanWorkspaceTab;
  assignmentId?: string | null;
  sessionId?: string | null;
};

export function PraktikanCourseWorkspace({
  user,
  course,
  workspaceTab,
  assignmentId,
}: PraktikanCourseWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const courseTheme = getCourseBannerTheme(course);
  const themeCfg = getThemeConfig(courseTheme.themeId);
  const patternCfg = getPatternConfig(courseTheme.patternId);

  const handleBackToCourses = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("courseId");
    params.delete("workspaceTab");
    params.delete("assignmentId");
    params.delete("sessionId");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleSelectTab = useCallback(
    (tab: PraktikanWorkspaceTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("workspaceTab", tab);
      params.delete("assignmentId");
      params.delete("sessionId");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleSelectAssignment = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("workspaceTab", "assignments");
      params.set("assignmentId", id);
      params.delete("sessionId");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleBackFromAssignment = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("workspaceTab", "assignments");
    params.delete("assignmentId");
    params.delete("sessionId");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  return (
    <div className="space-y-6">
      {/* Top back button & breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBackToCourses}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-full shadow-xs transition-colors apple-press"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Classes</span>
        </button>

        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Classes / {course.code}
        </span>
      </div>

      {/* Persistent Course Banner — visible across all tabs */}
      <header
        className={`rounded-3xl p-6 sm:p-8 text-white shadow-xs relative overflow-hidden ${
          !courseTheme.imageUrl ? themeCfg.gradientClass : "bg-slate-900"
        }`}
      >
        {courseTheme.imageUrl && (
          <>
            <div
              role="presentation"
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${courseTheme.imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/70" />
          </>
        )}

        {patternCfg.id !== "none" && (
          <div
            className={`absolute inset-0 pointer-events-none ${patternCfg.overlayClass}`}
          />
        )}

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${themeCfg.badgeBg} px-3 py-1 rounded-full backdrop-blur-xs`}
              >
                {course.code}
              </span>
              <span className="text-white/40" aria-hidden="true">
                ·
              </span>
              <span className="text-xs font-semibold text-white/80">
                {course.is_active ? "Active" : "Archived"}
              </span>
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-xs">
              {course.name}
            </h1>

            <p className="mt-2 text-xs text-slate-200 flex items-center gap-2 drop-shadow-xs">
              <CalendarBlank className="w-4 h-4 text-white/70" weight="bold" />
              <span>
                Academic Year {course.academic_year} • Semester {course.semester}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-white backdrop-blur-xs flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-white">
                Praktikan
              </span>
              <span className="opacity-40">•</span>
              <span>Enrolled</span>
            </span>
          </div>
        </div>
      </header>

      {/* In-workspace Tab Navigation — visible on mobile (<md), scrollable pills */}
      {!assignmentId && (
        <nav
          className="flex items-center gap-1 overflow-x-auto scrollbar-none -mx-1 px-1 md:hidden"
          aria-label="Course workspace tabs"
        >
          {WORKSPACE_TABS.map((tab) => {
            const isActive = workspaceTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full transition-all duration-200 shrink-0 apple-press ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Stream Tab: Upcoming Deadlines & Next Session + Announcements */}
      {workspaceTab === "stream" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <aside className="lg:col-span-1">
            <CourseUpcomingWidget
              userId={user.id}
              courseId={course.id}
              viewerRole="praktikan"
              onNavigateToAssignments={() => handleSelectTab("assignments")}
              onSelectAssignment={handleSelectAssignment}
              onNavigateToSessions={() => handleSelectTab("sessions")}
            />
          </aside>

          <main className="lg:col-span-3 min-w-0">
            <CourseStream
              userId={user.id}
              courseId={course.id}
              viewerRole="praktikan"
            />
          </main>
        </div>
      )}

      {/* Modules Tab: Module List (read-only for students) */}
      {workspaceTab === "modules" && (
        <CourseModules
          userId={user.id}
          courseId={course.id}
          accessMode="read-only"
        />
      )}

      {/* Assignments Tab: Submissions View or Assignments List */}
      {workspaceTab === "assignments" &&
        (assignmentId ? (
          <PraktikanAssignmentDetailPage
            courseId={course.id}
            assignmentId={assignmentId}
            onBack={handleBackFromAssignment}
          />
        ) : (
          <CourseAssignments
            userId={user.id}
            courseId={course.id}
            viewerRole="praktikan"
            onSelectAssignment={handleSelectAssignment}
          />
        ))}

      {/* People Tab: Enrolled Student Membership Details */}
      {workspaceTab === "people" && (
        <PraktikanCourseMembership user={user} />
      )}

      {/* Sessions Tab: Attendance Records & Published Grades */}
      {workspaceTab === "sessions" && (
        <div className="space-y-8">
          <PraktikanCourseAttendance userId={user.id} courseId={course.id} />
          <PraktikanCourseGrades userId={user.id} courseId={course.id} />
        </div>
      )}
    </div>
  );
}
