"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Course } from "@/features/courses/types/course.type";
import type { User } from "@/types/user.type";
import { CourseStream } from "@/features/announcements/components/course-stream";
import { CourseModules } from "@/features/modules/components/course-modules";
import { CourseAssignments } from "@/features/assignments/components/course-assignments";
import { PraktikanAssignmentDetailPage } from "@/features/assignments/components/praktikan-assignment-detail-page";
import { PraktikanCourseMembership } from "./praktikan-course-membership";
import { PraktikanCourseAttendance } from "@/features/attendance/components/praktikan-course-attendance";
import { PraktikanCourseGrades } from "@/features/grades/components/praktikan-course-grades";
import {
  getThemeConfig,
  getPatternConfig,
  getCourseBannerTheme
} from "../constants/banner-themes";

export type PraktikanWorkspaceTab =
  | "stream"
  | "modules"
  | "assignments"
  | "people"
  | "sessions";

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
  assignmentId
}: PraktikanCourseWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const courseTheme = getCourseBannerTheme(course);
  const themeCfg = getThemeConfig(courseTheme.themeId);
  const patternCfg = getPatternConfig(courseTheme.patternId);

  const handleSelectAssignment = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("assignmentId", id);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleBackFromAssignment = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("assignmentId");
    params.delete("sessionId");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  return (
    <div className="space-y-6">
      {/* Stream Tab: Banner Card & Announcements Stream */}
      {workspaceTab === "stream" && (
        <div className="space-y-6">
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

            <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/90 drop-shadow-xs">
                    {course.code}
                  </span>
                  <span className="text-white/40" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-xs font-semibold text-white/80">
                    {course.is_active ? "Active" : "Archived"}
                  </span>
                </div>

                <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl drop-shadow-xs">
                  {course.name}
                </h1>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/15 pt-5 text-sm text-slate-200 relative z-10">
              <span>Academic year {course.academic_year}</span>
              <span>Semester {course.semester}</span>
            </div>
          </header>

          <CourseStream
            userId={user.id}
            courseId={course.id}
            viewerRole="praktikan"
          />
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
