<<<<<<< HEAD
=======
"use client";

>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
import type { Course } from "../types/course.type";
import {
  getThemeConfig,
  getPatternConfig,
  getCourseBannerTheme,
} from "../constants/banner-themes";
import {
  CaretRight
} from "@phosphor-icons/react";

type PraktikanCourseCardProps = {
  course: Course;
};

export function PraktikanCourseCard({ course }: PraktikanCourseCardProps) {
  const cTheme = getCourseBannerTheme(course);
  const theme = getThemeConfig(cTheme.themeId);
  const patternCfg = getPatternConfig(cTheme.patternId);

  return (
<<<<<<< HEAD
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md">
      <div
        className={`relative min-h-28 p-5 text-white ${
=======
    <article className="group bg-white rounded-3xl border border-slate-200 shadow-xs apple-card-hover overflow-hidden cursor-pointer flex flex-col justify-between h-full">
      {/* Customizable Card Header Banner */}
      <div
        className={`${
>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
          !cTheme.imageUrl ? theme.gradientClass : "bg-slate-900"
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
<<<<<<< HEAD

        <div className="relative z-10 flex items-start justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/90 drop-shadow-xs">
            {course.code}
          </span>
          {!course.is_active ? (
            <span className="text-xs font-medium text-white/70">
              Archived
            </span>
          ) : null}
        </div>
        <h3 className="relative z-10 mt-2 line-clamp-1 text-lg font-bold tracking-tight text-white drop-shadow-xs">
          {course.name}
        </h3>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 bg-white text-xs">
        <p className="text-slate-600 font-medium">
          Academic year {course.academic_year} · Semester {course.semester}
        </p>
        <span className="mt-4 inline-flex items-center text-sm font-semibold text-slate-900 group-hover:text-slate-700">
          Open practicum class
        </span>
=======
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/90 drop-shadow-xs">
              {course.code}
            </span>
            <span className="text-white/40" aria-hidden="true">·</span>
            <span className="text-[11px] font-medium text-white/80">
              {course.semester} {course.academic_year}
            </span>
          </div>
          <h3 className="text-sm font-bold mt-2 text-white group-hover:underline line-clamp-1 drop-shadow-xs">
            {course.name}
          </h3>
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
            <span>Open class</span>
            <CaretRight className="w-3.5 h-3.5" />
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Semester {course.semester}
          </span>
        </div>
>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
      </div>
    </article>
  );
}
