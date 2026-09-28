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
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md">
      <div
        className={`relative min-h-28 p-5 text-white ${
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
      </div>
    </article>
  );
}
