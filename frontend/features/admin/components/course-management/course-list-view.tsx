"use client";

import React, { useState, useMemo } from "react";
import type { Course } from "@/features/admin/types";
import { NotificationBanner } from "@/components/ui/notification-banner";
import {
  getThemeConfig,
  getPatternConfig,
  getDeterministicThemeId,
  getCourseBannerTheme,
  type SavedCourseTheme,
} from "@/features/courses/constants/banner-themes";
import {
  CaretRightIcon,
  SquaresFourIcon,
  ListBulletsIcon,
  PaletteIcon,
  PencilSimpleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon
} from "@phosphor-icons/react";

interface CourseListViewProps {
  courses: Course[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  courseThemes: Record<string, SavedCourseTheme>;
  onOpenWorkspace: (course: Course) => void;
  onCreateCourse: () => void;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (course: Course) => void;
  onCustomizeBanner: (course: Course) => void;
}

export function CourseListView({
  courses,
  isLoading,
  error = null,
  onRetry,
  courseThemes,
  onOpenWorkspace,
  onCreateCourse,
  onEditCourse,
  onDeleteCourse,
  onCustomizeBanner,
}: CourseListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.academic_year.toLowerCase().includes(q)
    );
  }, [courses, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Action Bar & Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              aria-label="Search courses"
              placeholder="Search courses by code, name, or year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
            />
            <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center bg-white border border-slate-200 rounded-full p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Grid View"
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <SquaresFourIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Table View"
              aria-label="Table view"
              aria-pressed={viewMode === "table"}
            >
              <ListBulletsIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onCreateCourse}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full shadow-xs transition-all flex items-center gap-1.5 active:scale-[0.98] cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Create course</span>
          </button>
        </div>
      </div>

      {/* Courses Catalog Display */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-xs">
          Loading courses...
        </div>
      ) : error ? (
        <NotificationBanner variant="error">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span>Couldn&apos;t load courses. {error}</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 transition"
              >
                Retry
              </button>
            )}
          </div>
        </NotificationBanner>
      ) : courses.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-xs">
          No courses yet. Click &quot;Create course&quot; to add the first one.
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-xs">
          No courses match your search.
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => {
            const cTheme =
              courseThemes[course.id] || getCourseBannerTheme(course);
            const themeCfg = getThemeConfig(
              cTheme.themeId || getDeterministicThemeId(course.code)
            );
            const patternCfg = getPatternConfig(cTheme.patternId);

            return (
              <div
                key={course.id}
                className="group relative bg-white rounded-3xl border border-slate-200 shadow-xs apple-card-hover overflow-hidden flex flex-col justify-between focus-within:ring-2 focus-within:ring-slate-900"
              >
                {/* Stretched button makes the whole card open the course. */}
                <button
                  type="button"
                  onClick={() => onOpenWorkspace(course)}
                  aria-label={`Open course ${course.code} ${course.name}`}
                  className="absolute inset-0 cursor-pointer focus:outline-none"
                />
                {/* Card Header Banner */}
                <div
                  className={`${
                    !cTheme.imageUrl ? themeCfg.gradientClass : "bg-slate-900"
                  } p-5 text-white relative overflow-hidden pointer-events-none`}
                >
                  {cTheme.imageUrl && (
                    <>
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${cTheme.imageUrl})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/70" />
                    </>
                  )}
                  {patternCfg.id !== "none" && (
                    <div
                      className={`absolute inset-0 pointer-events-none ${patternCfg.overlayClass}`}
                    />
                  )}
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
                        {course.code}
                      </span>
                      <h3 className="text-base font-bold mt-1 text-white group-hover:underline line-clamp-1">
                        {course.name}
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-white/80">
                      Semester {course.semester}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Academic Period
                      </span>
                      <span className="font-medium text-slate-800">
                        {course.academic_year}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Status
                      </span>
                      <span className="font-semibold text-slate-900 block mt-0.5">
                        {course.is_active ? "Active" : "Archived"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-900 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Open course</span>
                      <CaretRightIcon className="w-3.5 h-3.5" />
                    </span>
                    <div className="relative flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onCustomizeBanner(course)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg text-xs transition-colors cursor-pointer"
                        title="Customize banner"
                        aria-label={`Customize banner for ${course.code}`}
                      >
                        <PaletteIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditCourse(course)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg text-xs transition-colors cursor-pointer"
                        title="Edit"
                        aria-label={`Edit ${course.code}`}
                      >
                        <PencilSimpleIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCourse(course)}
                        className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg text-xs transition-colors cursor-pointer"
                        title="Delete"
                        aria-label={`Delete ${course.code}`}
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3.5 pl-5">Code</th>
                  <th className="p-3.5">Course Name</th>
                  <th className="p-3.5">Academic Period</th>
                  <th className="p-3.5">Semester</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourses.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => onOpenWorkspace(c)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 pl-5 font-semibold text-slate-900">{c.code}</td>
                    <td className="p-3.5 font-medium text-slate-800">{c.name}</td>
                    <td className="p-3.5 text-slate-600">{c.academic_year}</td>
                    <td className="p-3.5 text-slate-600">{c.semester}</td>
                    <td className="p-3.5">
                      <span className={`font-semibold ${c.is_active ? "text-slate-900" : "text-slate-500"}`}>
                        {c.is_active ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td
                      className="p-3.5 pr-5 text-right space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onOpenWorkspace(c)}
                        aria-label={`Open course ${c.code}`}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg text-xs cursor-pointer"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCourse(c);
                        }}
                        aria-label={`Delete course ${c.code}`}
                        className="px-3 py-1 hover:bg-rose-50 text-rose-600 font-medium rounded-lg text-xs cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
