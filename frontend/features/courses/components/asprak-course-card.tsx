import { CalendarDays } from "lucide-react";
import type { Course } from "../types/course.type";
import {
  getThemeConfig,
  getPatternConfig,
  getCourseBannerTheme,
} from "../constants/banner-themes";

type AsprakCourseCardProps = {
  course: Course;
};

export function AsprakCourseCard({ course }: AsprakCourseCardProps) {
  const statusLabel = course.is_active
    ? "Active offering"
    : "Historical offering";

  const cTheme = getCourseBannerTheme(course);
  const themeCfg = getThemeConfig(cTheme.themeId);
  const patternCfg = getPatternConfig(cTheme.patternId);

  return (
    <article className="h-full rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
      {/* Banner Top Area */}
      <div className={`${!cTheme.imageUrl ? themeCfg.gradientClass : "bg-slate-900"} p-5 text-white relative overflow-hidden`}>
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

        <div className="relative z-10">
          <div className="flex items-center justify-between text-[11px]">
            <span className={`font-semibold ${themeCfg.badgeBg} px-2 py-0.5 rounded text-[10px] uppercase tracking-wider backdrop-blur-xs`}>
              {course.code}
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] text-white border border-white/10 backdrop-blur-xs">
              {statusLabel}
            </span>
          </div>

          <h3 className="mt-2.5 text-base font-bold text-white line-clamp-1 drop-shadow-xs">
            {course.name}
          </h3>
        </div>
      </div>

      {/* Card Body & Footer */}
      <div className="p-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 text-xs text-slate-600 bg-white">
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          Academic year {course.academic_year}
        </span>
        <span className="text-slate-500 font-medium">Semester {course.semester}</span>
      </div>
    </article>
  );
}
