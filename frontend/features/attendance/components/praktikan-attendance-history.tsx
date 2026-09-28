"use client";

<<<<<<< HEAD
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
=======
import { AsteriskLoader } from "@/components/ui/asterisk-loader";
>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
import { useMemo, useState } from "react";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { ApiError } from "@/lib/api/client";
import { usePersonalAttendance } from "../hooks/use-personal-attendance";
import type { AttendanceStatus, PersonalAttendanceHistoryItem } from "../types/attendance.type";
import {
  CheckCircle,
  ClipboardText,
  ArrowsClockwise
} from "@phosphor-icons/react";

type Props = { userId: string };
type StatusFilter = "all" | AttendanceStatus;
const INITIAL_LIMIT = 60;

const labels: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  alfa: "Alfa",
};

const statusTextColors: Record<AttendanceStatus, string> = {
  hadir: "text-emerald-700 font-semibold",
  sakit: "text-sky-700 font-semibold",
  izin: "text-amber-700 font-semibold",
  alfa: "text-rose-700 font-semibold",
};

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : dateFormatter.format(date);
}

function sortRows(rows: PersonalAttendanceHistoryItem[]) {
  return [...rows].sort(
    (a, b) =>
      (b.session_date ?? "").localeCompare(a.session_date ?? "") ||
      a.session_title.localeCompare(b.session_title)
  );
}

export function PraktikanAttendanceHistory({ userId }: Props) {
  const query = usePersonalAttendance(userId);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [limit, setLimit] = useState(INITIAL_LIMIT);

  const rows = useMemo(() => query.data ?? [], [query.data]);
  const courses = useMemo(
    () =>
      Array.from(
        new Map(
          rows.map((row) => [
            row.course_id,
            { id: row.course_id, label: `${row.course_code} · ${row.course_name}` },
          ])
        ).values()
      ).sort((a, b) => a.label.localeCompare(b.label)),
    [rows]
  );

<<<<<<< HEAD
  if (query.isPending) return <div role="status" className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span className="ml-3 text-sm text-slate-600">Loading your attendance...</span></div>;
  if (query.isError) { const status = query.error instanceof ApiError ? query.error.status : null; return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6"><AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" /><h2 className="mt-3 text-lg font-semibold text-red-950">Couldn&apos;t load attendance</h2><p className="mt-1 text-sm text-red-800">{status === 401 ? "You've been signed out. Sign in again to continue." : "Couldn't reach the server. Let's try that again."}</p>{status !== 401 ? <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-60"><RefreshCw className="h-4 w-4" aria-hidden="true" />Try again</button> : null}</div>; }

  return (
    <div aria-busy={query.isFetching}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="inline text-slate-500">Recorded: </dt>
            <dd className="inline font-semibold text-slate-950">{rows.length}</dd>
          </div>
          {(["hadir", "sakit", "izin", "alfa"] as AttendanceStatus[]).map((status) => (
            <div key={status}>
              <dt className="inline text-slate-500">{labels[status]}: </dt>
              <dd className="inline font-semibold text-slate-950">
                {rows.filter((row) => row.status === status).length}
              </dd>
            </div>
          ))}
        </dl>
=======
  const filtered = sortRows(
    rows.filter(
      (row) =>
        (statusFilter === "all" || row.status === statusFilter) &&
        (courseFilter === "all" || row.course_id === courseFilter)
    )
  );

  const visible = filtered.slice(0, limit);
  const groups = Array.from(
    visible
      .reduce((groupMap, row) => {
        const key = `${row.academic_year}|${row.semester}|${row.course_id}`;
        const current = groupMap.get(key);
        if (current) current.rows.push(row);
        else {
          groupMap.set(key, {
            key,
            title: `${row.course_code} · ${row.course_name}`,
            period: `${row.academic_year} · Semester ${row.semester}`,
            rows: [row],
          });
        }
        return groupMap;
      }, new Map<string, { key: string; title: string; period: string; rows: PersonalAttendanceHistoryItem[] }>())
      .values()
  );

  if (query.isPending) {
    return (
      <div
        role="status"
        className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white"
      >
        <AsteriskLoader className="h-5 w-5 text-slate-400" aria-hidden="true" />
        <span className="ml-3 text-xs font-medium text-slate-600">Loading your attendance...</span>
      </div>
    );
  }

  if (query.isError) {
    const status = query.error instanceof ApiError ? query.error.status : null;
    return (
      <NotificationBanner variant="error">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div>
            <h3 className="font-semibold text-white">Couldn&apos;t load attendance</h3>
            <p className="mt-0.5 text-xs text-slate-300">
              {status === 401
                ? "You've been signed out. Sign in again to continue."
                : "Couldn't reach the server. Let's try that again."}
            </p>
          </div>
          {status !== 401 ? (
            <button
              type="button"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition disabled:opacity-60 shrink-0"
            >
              <ArrowsClockwise className={`h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
              Try again
            </button>
          ) : null}
        </div>
      </NotificationBanner>
    );
  }

  return (
    <section aria-labelledby="attendance-history-heading" aria-busy={query.isFetching} className="space-y-6">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance Log</p>
          <h1 id="attendance-history-heading" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            My Attendance
          </h1>
          <p className="mt-1 text-xs text-slate-500">Keep track of your presence across all practicum meetings.</p>
        </div>

>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
        <button
          type="button"
          aria-label="Refresh attendance"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
<<<<<<< HEAD
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={query.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-64">
          <label htmlFor="attendance-course-filter" className="sr-only">Filter by course</label>
          <select
            id="attendance-course-filter"
            value={courseFilter}
            onChange={(event) => {
              setCourseFilter(event.target.value);
              setLimit(INITIAL_LIMIT);
            }}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
          >
            <option value="all">All courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-48">
          <label htmlFor="attendance-status-filter" className="sr-only">Filter by status</label>
          <select
            id="attendance-status-filter"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              setLimit(INITIAL_LIMIT);
            }}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
          >
            <option value="all">All statuses</option>
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={label}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div role="status" className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="text-base font-semibold text-slate-950">No attendance records yet</h2>
          <p className="mt-1 text-sm text-slate-600">Attendance marked during your lab sessions will show up here.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {groups.map((group, index) => (
            <section key={group.key} aria-labelledby={`attendance-group-${index}`}>
              <div className="border-b border-slate-200 pb-2">
                <h2 id={`attendance-group-${index}`} className="font-semibold text-slate-950">
                  {group.title}
                </h2>
                <p className="text-xs text-slate-500">{group.period}</p>
              </div>
              <ul className="divide-y divide-slate-100">
                {group.rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-950">
                        {row.session_title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDate(row.session_date)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[row.status]}`}
                    >
                      {labels[row.status]}
                    </span>
                  </li>
                ))}
              </ul>
=======
          className="p-2 self-start sm:self-auto rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          title="Refresh attendance"
        >
          <ArrowsClockwise className={`w-3.5 h-3.5 ${query.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
        </button>
      </div>

      {/* Clean Filters & Segmented Status Bar (No Chunky Analytics Cards) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="w-full sm:w-auto flex-1 max-w-sm">
            <select
              id="attendance-course-filter"
              aria-label="Filter by course"
              value={courseFilter}
              onChange={(event) => {
                setCourseFilter(event.target.value);
                setLimit(INITIAL_LIMIT);
              }}
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="all">All practicum classes ({courses.length})</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.label}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs font-medium text-slate-400">
            {filtered.length} {filtered.length === 1 ? "record" : "records"} found
          </span>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 py-0.5">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setLimit(INITIAL_LIMIT);
            }}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all apple-press ${
              statusFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All ({rows.length})
          </button>

          {(["hadir", "sakit", "izin", "alfa"] as AttendanceStatus[]).map((status) => {
            const count = rows.filter((r) => r.status === status).length;
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setStatusFilter(status);
                  setLimit(INITIAL_LIMIT);
                }}
                className={`whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all apple-press ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    status === "hadir"
                      ? "bg-emerald-500"
                      : status === "sakit"
                      ? "bg-sky-500"
                      : status === "izin"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                />
                <span>{labels[status]}</span>
                <span className="text-[11px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List / Groups */}
      {visible.length === 0 ? (
        <div
          role="status"
          className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-xs"
        >
          <ClipboardText className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 text-sm font-bold text-slate-950">No attendance records yet</h2>
          <p className="mt-1 text-xs text-slate-500">
            Attendance marked during your lab sessions will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group, index) => (
            <section key={group.key} aria-labelledby={`attendance-group-${index}`} className="space-y-3">
              <div>
                <h2 id={`attendance-group-${index}`} className="text-sm font-bold text-slate-950">
                  {group.title}
                </h2>
                <p className="text-xs text-slate-400">{group.period}</p>
              </div>

              <div className="space-y-2.5">
                {group.rows.map((row) => (
                    <article
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs apple-card-hover transition-all"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <CheckCircle className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-950">{row.session_title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{formatDate(row.session_date)}</p>
                        </div>
                      </div>

                      <span
                        className={`text-xs ${statusTextColors[row.status]}`}
                      >
                        {labels[row.status]}
                      </span>
                    </article>
                ))}
              </div>
>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
            </section>
          ))}
        </div>
      )}

      {visible.length < filtered.length ? (
        <button
          type="button"
          onClick={() => setLimit((value) => value + INITIAL_LIMIT)}
<<<<<<< HEAD
          className="mt-6 inline-flex min-h-10 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50"
=======
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
        >
          Show more ({filtered.length - visible.length} remaining)
        </button>
      ) : null}
<<<<<<< HEAD
    </div>
=======
    </section>
>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
  );
}
