"use client";

import Link from "next/link";
import { AlertCircle, BookOpen, Grid2X2, List, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { getCourseDetailRoute, ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useEnrolledCourses } from "../hooks/use-enrolled-courses";
import type { Course } from "../types/course.type";
import { PraktikanCourseCard } from "./praktikan-course-card";
import { PraktikanCourseTable } from "./praktikan-course-table";

type PraktikanCourseListProps = { userId: string };
type ViewMode = "grid" | "table";

function sortCourses(courses: Course[]) {
  return [...courses].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    const period = b.academic_year.localeCompare(a.academic_year);
    return period || a.code.localeCompare(b.code);
  });
}

export function PraktikanCourseList({ userId }: PraktikanCourseListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const query = useEnrolledCourses(userId);
  const courses = sortCourses(query.data ?? []);
  const status = query.error instanceof ApiError ? query.error.status : null;

  if (query.isPending) {
    return <div role="status" className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span className="ml-3 text-sm text-slate-600">Loading your practicum classes...</span></div>;
  }

  if (query.isError) {
    return (
      <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-6">
        <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
        <h2 className="mt-3 text-lg font-semibold text-red-950">Your classes could not be loaded</h2>
        <p className="mt-1 text-sm leading-6 text-red-800">{status === 401 ? "Your session has expired. Sign in again to continue." : status === 403 ? "Your account cannot access the Praktikan class list." : "A network or server problem interrupted the request."}</p>
        {status === 401 ? <Link href={ROUTES.login} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-red-700 px-4 text-sm font-semibold text-white">Go to sign in</Link> : <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-60"><RefreshCw className={query.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />Try again</button>}
      </div>
    );
  }

  return (
    <div aria-busy={query.isFetching}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Enrolled academic periods</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">My Practicum Classes</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Open active learning spaces or revisit materials from earlier offerings.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" aria-label="Course display" role="group">
            <button type="button" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-emerald-700 ${viewMode === "grid" ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}><Grid2X2 className="h-4 w-4" aria-hidden="true" />Grid</button>
            <button type="button" aria-pressed={viewMode === "table"} onClick={() => setViewMode("table")} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-emerald-700 ${viewMode === "table" ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}><List className="h-4 w-4" aria-hidden="true" />Table</button>
          </div>
          <button type="button" aria-label="Refresh classes" onClick={() => void query.refetch()} disabled={query.isFetching} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw className={query.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" /></button>
        </div>
      </div>

      {courses.length === 0 ? (
        <div role="status" className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><BookOpen className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" /><h2 className="mt-3 font-semibold text-slate-950">No enrolled classes yet</h2><p className="mt-1 text-sm text-slate-600">Your practicum classes will appear here after enrollment.</p></div>
      ) : viewMode === "table" ? (
        <div className="mt-6"><PraktikanCourseTable courses={courses} /></div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{courses.map((course) => <Link key={course.id} href={getCourseDetailRoute(course.id)} className="rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"><PraktikanCourseCard course={course} /></Link>)}</div>
      )}
    </div>
  );
}
