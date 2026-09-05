import { CalendarDays, MoveRight } from "lucide-react";
import type { Course } from "../types/course.type";
import {
  getThemeConfig,
  getPatternConfig,
  getCourseBannerTheme,
} from "../constants/banner-themes";

type PraktikanCourseCardProps = {
  course: Course;
};

export function PraktikanCourseCard({ course }: PraktikanCourseCardProps) {
  const cTheme = getCourseBannerTheme(course);
  const theme = getThemeConfig(cTheme.themeId);
  const patternCfg = getPatternConfig(cTheme.patternId);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`relative min-h-32 p-5 text-white ${
          !cTheme.imageUrl ? theme.gradientClass : "bg-slate-900"
        } overflow-hidden`}
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
          <div className={`absolute inset-0 pointer-events-none ${patternCfg.overlayClass}`} />
        )}

        <div className="relative z-10 flex items-start justify-between gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${theme.badgeBg} backdrop-blur-xs`}>
            {course.code}
          </span>
          <span className="rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
            {course.is_active ? "Active" : "History"}
          </span>
        </div>
        <h3 className="relative z-10 mt-5 line-clamp-2 text-xl font-bold tracking-tight drop-shadow-xs">
          {course.name}
        </h3>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="inline-flex items-center gap-2 text-sm text-slate-600">
          <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden="true" />
          {course.academic_year} · Semester {course.semester}
        </p>
        <span className="mt-auto inline-flex min-h-11 items-center gap-2 pt-5 text-sm font-semibold text-emerald-700 group-hover:text-emerald-800">
          Open practicum class
          <MoveRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
