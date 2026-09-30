"use client";

import Link from "next/link";
import { getCourseDetailRoute } from "@/constants/routes";
import type { Course } from "../types/course.type";
import {
  CaretRight
} from "@phosphor-icons/react";

type PraktikanCourseTableProps = {
  courses: Course[];
  onNavigateToCourse?: (courseId: string) => void;
};

export function PraktikanCourseTable({
  courses,
  onNavigateToCourse
}: PraktikanCourseTableProps) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
      <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
        <caption className="sr-only">Your enrolled practicum classes</caption>
        <thead className="bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            <th scope="col" className="px-5 py-3.5">Class</th>
            <th scope="col" className="px-5 py-3.5">Academic period</th>
            <th scope="col" className="px-5 py-3.5">Status</th>
            <th scope="col" className="px-5 py-3.5 text-right"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {courses.map((course) => (
            <tr key={course.id} className="transition-colors hover:bg-slate-50/75">
              <td className="px-5 py-4">
                <p className="font-semibold text-slate-950 text-sm">{course.name}</p>
                <p className="mt-0.5 text-[11px] font-mono font-medium uppercase tracking-wide text-slate-500">{course.code}</p>
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-slate-700 font-medium">
                {course.academic_year} · Semester {course.semester}
              </td>
              <td className="px-5 py-4">
                <span className={`font-semibold ${course.is_active ? "text-slate-900" : "text-slate-500"}`}>
                  {course.is_active ? "Active" : "Archived"}
                </span>
              </td>
              <td className="px-5 py-4 text-right">
                <Link
                  href={getCourseDetailRoute(course.id)}
                  onClick={(e) => {
                    if (onNavigateToCourse) {
                      e.preventDefault();
                      onNavigateToCourse(course.id);
                    }
                  }}
                  aria-label={`Open ${course.name}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer apple-press"
                >
                  <span>Open</span>
                  <CaretRight className="w-3.5 h-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
