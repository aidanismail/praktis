import { BookOpen, CalendarDays } from "lucide-react";
import type { Course } from "../types/course.type";

type AsprakCourseCardProps = {
  course: Course;
};

export function AsprakCourseCard({ course }: AsprakCourseCardProps) {
  const statusLabel = course.is_active
    ? "Active offering"
    : "Historical offering";

  return (
    <article className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </span>

          <div>
            <p className="text-sm font-semibold text-emerald-700">
              {course.code}
            </p>

            <h3 className="mt-1 font-semibold text-slate-950">{course.name}</h3>
          </div>

        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            course.is_active
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Academic year {course.academic_year}
        </span>
        <span>Semester {course.semester}</span>
      </div>
    </article>
  );
}
