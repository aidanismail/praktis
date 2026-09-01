"use client";

import { AlertCircle, GraduationCap, Loader2, RefreshCw } from "lucide-react";
import { useCourseSessions } from "@/features/sessions/hooks/use-course-sessions";
import { usePersonalGrades } from "../hooks/use-personal-grades";

type Props = { userId: string; courseId: string };
const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium" });
function formatDate(value: string | null) { if (!value) return "Date unavailable"; const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? "Date unavailable" : dateFormatter.format(date); }
function formatScore(value: number) { return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, ""); }

export function PraktikanCourseGrades({ userId, courseId }: Props) {
  const query = usePersonalGrades(userId);
  const sessionsQuery = useCourseSessions({ userId, courseId, enabled: true });
  if (query.isPending || sessionsQuery.isPending) return <div role="status" className="flex min-h-40 items-center justify-center rounded-3xl border border-slate-200 bg-white"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span className="ml-3 text-sm text-slate-600">Loading published grades...</span></div>;
  if (query.isError || sessionsQuery.isError) return <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-5"><AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" /><h2 className="mt-3 font-semibold text-red-950">Published grades could not be loaded</h2><button type="button" onClick={() => { void query.refetch(); void sessionsQuery.refetch(); }} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"><RefreshCw className="h-4 w-4" aria-hidden="true" />Try again</button></div>;
  const rows = new Map((query.data ?? []).filter((row) => row.course_id === courseId).map((row) => [row.session_id, row]));
  const sessions = [...(sessionsQuery.data ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  return <section aria-labelledby="course-grades-heading"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Session results</p><h2 id="course-grades-heading" className="mt-1 text-xl font-semibold text-slate-950">My grades in this class</h2><p className="mt-1 text-sm text-slate-600">Draft results remain private until they are released.</p></div>{sessions.length === 0 ? <div role="status" className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center"><GraduationCap className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" /><h3 className="mt-3 font-semibold text-slate-950">No session results</h3></div> : <div className="mt-5 grid gap-3 sm:grid-cols-2">{sessions.map((session) => { const row = rows.get(session.id); return <article key={session.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold text-slate-950">{session.title}</h3><p className="mt-1 text-sm text-slate-600">{formatDate(session.date)}</p></div>{!session.grades_published ? <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">Not released</span> : row ? <span className="rounded-xl bg-emerald-50 px-3 py-2 text-lg font-bold text-emerald-900">{formatScore(row.score)}</span> : <span className="max-w-36 rounded-xl bg-amber-50 px-3 py-2 text-right text-xs font-semibold text-amber-800">No published score available</span>}</div></article>; })}</div>}</section>;
}
