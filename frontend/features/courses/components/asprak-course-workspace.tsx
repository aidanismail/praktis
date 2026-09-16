"use client";

import { useState, useEffect } from "react";
import { Palette } from "lucide-react";
import type { Course } from "@/features/courses/types/course.type";
import { CourseStream } from "@/features/announcements/components/course-stream";
import { CourseModules } from "@/features/modules/components/course-modules";
import { CourseAssignments } from "@/features/assignments/components/course-assignments";
import { AssignedAssignmentDetail } from "@/features/assignments/components/asprak-assignment-detail-page";
import { CourseRoster } from "./course-roster";
import { CourseSessions } from "@/features/sessions/components/course-sessions";
import { AssignedSessionDetail } from "@/features/sessions/components/asprak-session-detail-page";
import {
  getThemeConfig,
  getPatternConfig,
  getCourseBannerTheme,
  type SavedCourseTheme
} from "../constants/banner-themes";
import { CourseBannerCustomizerModal } from "./course-banner-customizer-modal";

export type AsprakWorkspaceTab =
  | "stream"
  | "modules"
  | "assignments"
  | "people"
  | "sessions";

type AsprakCourseWorkspaceProps = {
  userId: string;
  course: Course;
  workspaceTab: AsprakWorkspaceTab;
  assignmentId?: string | null;
  sessionId?: string | null;
};

export function AsprakCourseWorkspace({
  userId,
  course,
  workspaceTab,
  assignmentId,
  sessionId
}: AsprakCourseWorkspaceProps) {
  const [overrideTheme, setOverrideTheme] = useState<SavedCourseTheme | null>(null);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  const courseTheme = overrideTheme || getCourseBannerTheme(course);
  const themeCfg = getThemeConfig(courseTheme.themeId);
  const patternCfg = getPatternConfig(courseTheme.patternId);

  useEffect(() => {
    const handleThemeUpdate = (e: Event) => {
      const custom = e as CustomEvent<SavedCourseTheme & { courseId: string }>;
      if (custom.detail?.courseId === course.id) {
        setOverrideTheme({
          themeId: custom.detail.themeId,
          patternId: custom.detail.patternId,
          imageUrl: custom.detail.imageUrl
        });
      }
    };
    window.addEventListener("course-theme-updated", handleThemeUpdate);
    return () => window.removeEventListener("course-theme-updated", handleThemeUpdate);
  }, [course.id]);

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
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${themeCfg.badgeBg} px-3 py-1 rounded-full backdrop-blur-xs`}
                >
                  {course.code}
                </span>

                <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl drop-shadow-xs">
                  {course.name}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold text-white border border-white/10 backdrop-blur-xs">
                  {course.is_active ? "Active" : "Archived"}
                </span>

                <button
                  type="button"
                  onClick={() => setShowCustomizeModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1 rounded-full backdrop-blur-xs transition-colors"
                >
                  <Palette className="h-3.5 w-3.5" />
                  <span>Customize Banner</span>
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/15 pt-5 text-sm text-slate-200 relative z-10">
              <span>Academic year {course.academic_year}</span>
              <span>Semester {course.semester}</span>
            </div>
          </header>

          <CourseStream
            userId={userId}
            courseId={course.id}
            viewerRole="asprak"
          />

          {showCustomizeModal && (
            <CourseBannerCustomizerModal
              isOpen={showCustomizeModal}
              course={course}
              onClose={() => setShowCustomizeModal(false)}
              onSaved={(savedTheme) => {
                setOverrideTheme(savedTheme);
              }}
            />
          )}
        </div>
      )}

      {/* Modules Tab: Module List & Upload Controls */}
      {workspaceTab === "modules" && (
        <CourseModules
          userId={userId}
          courseId={course.id}
          accessMode="manage"
        />
      )}

      {/* Assignments Tab: Submissions View or Assignments List */}
      {workspaceTab === "assignments" && (
        assignmentId ? (
          <AssignedAssignmentDetail
            userId={userId}
            courseId={course.id}
            assignmentId={assignmentId}
          />
        ) : (
          <CourseAssignments
            userId={userId}
            courseId={course.id}
            viewerRole="asprak"
          />
        )
      )}

      {/* People Tab: Enrolled Students & Assigned Staff */}
      {workspaceTab === "people" && (
        <CourseRoster
          userId={userId}
          courseId={course.id}
        />
      )}

      {/* Sessions Tab: Session Detail Register or Session List */}
      {workspaceTab === "sessions" && (
        sessionId ? (
          <AssignedSessionDetail
            userId={userId}
            courseId={course.id}
            sessionId={sessionId}
          />
        ) : (
          <CourseSessions
            userId={userId}
            courseId={course.id}
          />
        )
      )}
    </div>
  );
}

