import Link from "next/link";
import { MoveRight } from "lucide-react";
import { getCourseDetailRoute } from "@/constants/routes";
import type { Course } from "../types/course.type";

type PraktikanCourseTableProps = {
  courses: Course[];
};

export function PraktikanCourseTable({ courses }: PraktikanCourseTableProps) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <caption className="sr-only">Your enrolled practicum classes</caption>
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-5 py-4">Class</th>
            <th scope="col" className="px-5 py-4">Academic period</th>
            <th scope="col" className="px-5 py-4">Status</th>
            <th scope="col" className="px-5 py-4"><span className="sr-only">Open</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {courses.map((course) => (
            <tr key={course.id} className="transition hover:bg-slate-50">
              <td className="px-5 py-4">
                <p className="font-semibold text-slate-950">{course.name}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{course.code}</p>
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                {course.academic_year} · {course.semester}
              </td>
              <td className="px-5 py-4">
                <span className={course.is_active ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800" : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"}>
                  {course.is_active ? "Active" : "History"}
                </span>
              </td>
              <td className="px-5 py-4 text-right">
                <Link
                  href={getCourseDetailRoute(course.id)}
                  aria-label={`Open ${course.name}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-semibold text-emerald-700 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                >
                  Open <MoveRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
