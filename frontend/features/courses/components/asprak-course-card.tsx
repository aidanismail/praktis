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
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/90 drop-shadow-xs">
              {course.code}
            </span>
            {!course.is_active ? (
              <span className="text-xs font-medium text-white/70">
                Archived
              </span>
            ) : null}
          </div>

          <h3 className="mt-2 text-lg font-bold text-white line-clamp-1 drop-shadow-xs">
            {course.name}
          </h3>
        </div>
      </div>

      {/* Card Body & Footer */}
      <div className="p-4 flex items-center justify-between border-t border-slate-100 text-xs text-slate-600 bg-white">
        <span className="font-medium text-slate-700">
          Academic year {course.academic_year}
        </span>
        <span className="text-slate-500 font-medium">Semester {course.semester}</span>
      </div>
    </article>
  );
}
