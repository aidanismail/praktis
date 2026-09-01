"use client";

import { AlertCircle, CalendarRange, Loader2, RefreshCw } from "lucide-react";
import { useCourseSessions } from "@/features/sessions/hooks/use-course-sessions";
import { getSessionAttendanceStatus } from "@/features/sessions/types/session.type";
import { usePersonalAttendance } from "../hooks/use-personal-attendance";
import type { AttendanceStatus } from "../types/attendance.type";

type Props = { userId: string; courseId: string };
const labels: Record<AttendanceStatus, string> = { hadir: "Hadir", sakit: "Sakit", izin: "Izin", alfa: "Alfa" };
const styles: Record<AttendanceStatus, string> = { hadir: "bg-emerald-50 text-emerald-800", sakit: "bg-sky-50 text-sky-800", izin: "bg-amber-50 text-amber-800", alfa: "bg-red-50 text-red-700" };
const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "full" });
function formatDate(value: string) { const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? "Date unavailable" : dateFormatter.format(date); }

export function PraktikanCourseAttendance({ userId, courseId }: Props) {
  const sessionsQuery = useCourseSessions({ userId, courseId, enabled: true });
  const attendanceQuery = usePersonalAttendance(userId);
  if (sessionsQuery.isPending || attendanceQuery.isPending) return <div role="status" className="flex min-h-56 items-center justify-center rounded-3xl border border-slate-200 bg-white"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span className="ml-3 text-sm text-slate-600">Loading sessions and attendance...</span></div>;
  if (sessionsQuery.isError || attendanceQuery.isError) return <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-6"><AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" /><h2 className="mt-3 font-semibold text-red-950">Sessions or attendance could not be loaded</h2><p className="mt-1 text-sm text-red-800">A network or access problem interrupted this view.</p><button type="button" onClick={() => { void sessionsQuery.refetch(); void attendanceQuery.refetch(); }} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"><RefreshCw className="h-4 w-4" aria-hidden="true" />Try again</button></div>;
  const attendance = new Map((attendanceQuery.data ?? []).filter((row) => row.course_id === courseId).map((row) => [row.session_id, row]));
  const sessions = [...(sessionsQuery.data ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  return <section aria-labelledby="praktikan-sessions-heading"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Read-only schedule</p><h2 id="praktikan-sessions-heading" className="mt-1 text-xl font-semibold text-slate-950">Sessions &amp; Attendance</h2><p className="mt-1 text-sm text-slate-600">Attendance windows are informational; saved records appear beside each session.</p></div>{sessions.length === 0 ? <div role="status" className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><CalendarRange className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" /><h3 className="mt-3 font-semibold text-slate-950">No sessions scheduled</h3></div> : <div className="mt-5 grid gap-4 lg:grid-cols-2">{sessions.map((session) => { const record = attendance.get(session.id); const windowState = getSessionAttendanceStatus(session.attendance_status); return <article key={session.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-950">{session.title}</h3><p className="mt-1 text-sm text-slate-600"><time dateTime={session.date}>{formatDate(session.date)}</time></p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Window: {windowState === "UNKNOWN" ? "Unavailable" : windowState.toLowerCase()}</span></div><div className="mt-5 border-t border-slate-100 pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">My attendance</p>{record ? <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${styles[record.status]}`}>{labels[record.status]}</span> : <span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">Not recorded</span>}</div></article>; })}</div>}</section>;
}
