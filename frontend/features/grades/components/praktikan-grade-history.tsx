"use client";

import { AlertCircle, GraduationCap, Loader2, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { usePersonalGrades } from "../hooks/use-personal-grades";
import type { PersonalGradeHistoryItem } from "../types/grade.type";

type Props = { userId: string };
const INITIAL_LIMIT = 60;
const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium" });
function formatDate(value: string | null) { if (!value) return "Date unavailable"; const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? "Date unavailable" : dateFormatter.format(date); }
function sortRows(rows: PersonalGradeHistoryItem[]) { return [...rows].sort((a, b) => (b.session_date ?? "").localeCompare(a.session_date ?? "") || a.session_title.localeCompare(b.session_title)); }
function formatScore(value: number) { return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, ""); }

export function PraktikanGradeHistory({ userId }: Props) {
  const query = usePersonalGrades(userId);
  const [courseFilter, setCourseFilter] = useState("all");
  const [limit, setLimit] = useState(INITIAL_LIMIT);
  const rows = useMemo(() => query.data ?? [], [query.data]);
  const courses = useMemo(() => Array.from(new Map(rows.map((row) => [row.course_id, { id: row.course_id, label: `${row.course_code} · ${row.course_name}` }])).values()).sort((a, b) => a.label.localeCompare(b.label)), [rows]);
  const filtered = sortRows(rows.filter((row) => courseFilter === "all" || row.course_id === courseFilter));
  const visible = filtered.slice(0, limit);
  const groups = Array.from(
    visible.reduce((groupMap, row) => {
      const key = `${row.academic_year}|${row.semester}|${row.course_id}`;
      const current = groupMap.get(key);
      if (current) current.rows.push(row);
      else groupMap.set(key, {
        key,
        title: `${row.course_code} · ${row.course_name}`,
        period: `${row.academic_year} · Semester ${row.semester}`,
        rows: [row]
      });
      return groupMap;
    }, new Map<string, { key: string; title: string; period: string; rows: PersonalGradeHistoryItem[] }>()).values()
  );
  const average = rows.length > 0 ? rows.reduce((sum, row) => sum + row.score, 0) / rows.length : null;

  if (query.isPending) return <div role="status" className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span className="ml-3 text-sm text-slate-600">Loading published grades...</span></div>;
  if (query.isError) { const status = query.error instanceof ApiError ? query.error.status : null; return <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-6"><AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" /><h1 className="mt-3 text-lg font-semibold text-red-950">Grades could not be loaded</h1><p className="mt-1 text-sm text-red-800">{status === 401 ? "Your session has expired." : "A network or server problem interrupted the request."}</p>{status !== 401 ? <button type="button" onClick={() => void query.refetch()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"><RefreshCw className="h-4 w-4" aria-hidden="true" />Try again</button> : null}</div>; }
  return <section aria-labelledby="grade-history-heading" aria-busy={query.isFetching}><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Published results</p><h1 id="grade-history-heading" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">My Grades</h1><p className="mt-2 text-sm text-slate-600">Only grades published for your account are shown.</p></div><button type="button" onClick={() => void query.refetch()} disabled={query.isFetching} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-60"><RefreshCw className={query.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />Refresh</button></div><dl className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><dt className="text-sm font-medium text-slate-600">Published grade entries</dt><dd className="mt-2 text-3xl font-bold text-slate-950">{rows.length}</dd></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><dt className="text-sm font-medium text-slate-600">Current average</dt><dd className="mt-2 text-3xl font-bold text-slate-950">{average === null ? "—" : formatScore(average)}</dd><p className="mt-2 text-xs text-slate-500">Across published session grades only</p></div></dl><div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4"><label htmlFor="grade-course-filter" className="text-sm font-medium text-slate-800">Course</label><select id="grade-course-filter" value={courseFilter} onChange={(event) => { setCourseFilter(event.target.value); setLimit(INITIAL_LIMIT); }} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm sm:max-w-md"><option value="all">All courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.label}</option>)}</select></div>{visible.length === 0 ? <div role="status" className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><GraduationCap className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" /><h2 className="mt-3 font-semibold text-slate-950">No published grades</h2><p className="mt-1 text-sm text-slate-600">Published session grades will appear here.</p></div> : <div className="mt-5 space-y-6">{groups.map((group, index) => <section key={group.key} aria-labelledby={`grade-group-${index}`}><div className="mb-3"><h2 id={`grade-group-${index}`} className="font-semibold text-slate-950">{group.title}</h2><p className="mt-1 text-xs text-slate-500">{group.period}</p></div><div className="space-y-3">{group.rows.map((row) => <article key={row.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="min-w-0"><p className="font-semibold text-slate-950">{row.session_title}</p><p className="mt-1 text-xs text-slate-500">{formatDate(row.session_date)}</p></div><div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Score</p><p className="mt-1 text-xl font-bold text-emerald-950">{formatScore(row.score)}</p></div></article>)}</div></section>)}</div>}{visible.length < filtered.length ? <button type="button" onClick={() => setLimit((value) => value + INITIAL_LIMIT)} className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800">Show more ({filtered.length - visible.length} remaining)</button> : null}</section>;
}
