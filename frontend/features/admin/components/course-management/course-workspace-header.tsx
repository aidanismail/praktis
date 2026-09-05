"use client";

import { Calendar, Palette, Pencil, ArrowLeft } from "lucide-react";
import type { Course } from "@/features/courses/types/course.type";
import {
  getThemeConfig,
  getPatternConfig,
  type SavedCourseTheme,
} from "@/features/courses/constants/banner-themes";

type CourseWorkspaceHeaderProps = {
  course: Course;
  theme: SavedCourseTheme;
  enrolledCount: number;
  staffCount: number;
  onBack: () => void;
  onCustomizeBanner: () => void;
  onEditCourse: () => void;
};

export function CourseWorkspaceHeader({
  course,
  theme,
  enrolledCount,
  staffCount,
  onBack,
  onCustomizeBanner,
  onEditCourse,
}: CourseWorkspaceHeaderProps) {
  const themeCfg = getThemeConfig(theme.themeId);
  const patternCfg = getPatternConfig(theme.patternId);

  return (
    <div className="space-y-4">
      {/* Top back button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-full shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Courses</span>
        </button>

        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Course Catalog / {course.code}
        </span>
      </div>

      {/* Customizable Classroom Header Banner */}
      <div
        className={`${
          !theme.imageUrl ? themeCfg.gradientClass : "bg-slate-900"
        } rounded-3xl p-6 sm:p-8 text-white shadow-xs relative overflow-hidden`}
      >
        {/* Custom Image Background */}
        {theme.imageUrl && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${theme.imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/70" />
          </>
        )}

        {/* Pattern Overlay */}
        {theme.patternId !== "none" && (
          <div
            className={`absolute inset-0 pointer-events-none ${patternCfg.overlayClass}`}
          />
        )}

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${themeCfg.badgeBg} px-3 py-1 rounded-full backdrop-blur-xs`}
            >
              {course.code}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold mt-3 text-white tracking-tight drop-shadow-xs">
              {course.name}
            </h1>
            <p className="text-xs text-slate-200 mt-1.5 flex items-center gap-2 drop-shadow-xs">
              <Calendar className="w-4 h-4 text-white/70" />
              <span>
                Academic Year {course.academic_year} • Semester {course.semester}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-white backdrop-blur-xs flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  course.is_active ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span>{course.is_active ? "Active" : "Archived"}</span>
              <span>•</span>
              <span>
                {enrolledCount} Enrolled • {staffCount} Asprak
              </span>
            </span>

            <button
              type="button"
              onClick={onCustomizeBanner}
              className="rounded-full border border-white/20 bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 backdrop-blur-xs shadow-xs"
              title="Customize Course Banner Theme"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Customize</span>
            </button>

            <button
              type="button"
              onClick={onEditCourse}
              className="rounded-full border border-white/20 bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors flex items-center gap-1 backdrop-blur-xs shadow-xs"
            >
              <Pencil className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

