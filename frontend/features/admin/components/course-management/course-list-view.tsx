"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronRight,
  LayoutGrid,
  List,
  Palette,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { Course } from "@/features/admin/types";
import {
  loadSavedCourseTheme,
  getThemeConfig,
  getPatternConfig,
  getDeterministicThemeId,
  type SavedCourseTheme,
} from "@/features/courses/constants/banner-themes";

interface CourseListViewProps {
  courses: Course[];
  isLoading: boolean;
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
              placeholder="Search course code, name, or academic year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
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
            >
              <LayoutGrid className="w-3.5 h-3.5" />
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
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onCreateCourse}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full shadow-xs transition-all flex items-center gap-1.5 active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Course</span>
          </button>
        </div>
      </div>

      {/* Courses Catalog Display */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-xs">
          Loading courses catalog...
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-xs">
          No practicum courses found matching your criteria.
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => {
            const cTheme =
              courseThemes[course.id] || loadSavedCourseTheme(course.id, course.code);
            const themeCfg = getThemeConfig(
              cTheme.themeId || getDeterministicThemeId(course.code)
            );
            const patternCfg = getPatternConfig(cTheme.patternId);

            return (
              <div
                key={course.id}
                onClick={() => onOpenWorkspace(course)}
                className="group bg-white rounded-3xl border border-slate-200 shadow-xs apple-card-hover overflow-hidden cursor-pointer flex flex-col justify-between"
              >
                {/* Customizable Card Header Banner */}
                <div
                  className={`${
                    !cTheme.imageUrl ? themeCfg.gradientClass : "bg-slate-900"
                  } p-5 text-white relative overflow-hidden`}
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
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${themeCfg.badgeBg} px-2 py-0.5 rounded-md backdrop-blur-xs`}
                      >
                        {course.code}
                      </span>
                      <h3 className="text-sm font-bold mt-2 text-white group-hover:underline line-clamp-1 drop-shadow-xs">
                        {course.name}
                      </h3>
                    </div>
                    <span className="text-[11px] font-medium bg-white/10 px-2 py-0.5 rounded-lg border border-white/10 backdrop-blur-xs">
                      {course.semester} {course.academic_year}
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
                        Offering Status
                      </span>
                      <span className="font-medium text-slate-800 flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            course.is_active ? "bg-emerald-500" : "bg-slate-400"
                          } inline-block`}
                        />
                        {course.is_active ? "Active" : "Archived"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-900 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Open Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCustomizeBanner(course);
                        }}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg text-xs transition-colors cursor-pointer"
                        title="Customize Banner"
                      >
                        <Palette className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCourse(course);
                        }}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg text-xs transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCourse(course);
                        }}
                        className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg text-xs transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
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
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg text-xs cursor-pointer"
                      >
                        Workspace
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCourse(c);
                        }}
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
