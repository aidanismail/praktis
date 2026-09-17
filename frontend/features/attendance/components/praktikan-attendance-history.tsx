"use client";

import { CheckCircle2, ClipboardCheck, Loader2, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { ApiError } from "@/lib/api/client";
import { usePersonalAttendance } from "../hooks/use-personal-attendance";
import type { AttendanceStatus, PersonalAttendanceHistoryItem } from "../types/attendance.type";

type Props = { userId: string };
type StatusFilter = "all" | AttendanceStatus;
const INITIAL_LIMIT = 60;

const labels: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  alfa: "Alfa",
};

const statusStyles: Record<AttendanceStatus, { badge: string; dot: string }> = {
  hadir: {
    badge: "border-emerald-200/60 bg-emerald-50/80 text-emerald-700",
    dot: "bg-emerald-500",
  },
  sakit: {
    badge: "border-sky-200/60 bg-sky-50/80 text-sky-700",
    dot: "bg-sky-500",
  },
  izin: {
    badge: "border-amber-200/60 bg-amber-50/80 text-amber-700",
    dot: "bg-amber-500",
  },
  alfa: {
    badge: "border-red-200/60 bg-red-50/80 text-red-700",
    dot: "bg-red-500",
  },
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
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-hidden="true" />
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
              <RefreshCw className={`h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
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

        <button
          type="button"
          aria-label="Refresh attendance"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
          className="p-2 self-start sm:self-auto rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          title="Refresh attendance"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${query.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
        </button>
      </div>

      {/* Metrics Row */}
      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <dt className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Total Recorded</dt>
          <dd className="mt-1 text-2xl sm:text-3xl font-bold text-slate-950">{rows.length}</dd>
        </div>
        {(["hadir", "sakit", "izin", "alfa"] as AttendanceStatus[]).map((status) => {
          const count = rows.filter((row) => row.status === status).length;
          return (
            <div key={status} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <dt className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                {labels[status]}
              </dt>
              <dd className="mt-1 text-2xl sm:text-3xl font-bold text-slate-950">{count}</dd>
            </div>
          );
        })}
      </dl>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          id="attendance-course-filter"
          aria-label="Filter by course"
          value={courseFilter}
          onChange={(event) => {
            setCourseFilter(event.target.value);
            setLimit(INITIAL_LIMIT);
          }}
          className="w-full sm:w-72 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
        >
          <option value="all">All courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.label}
            </option>
          ))}
        </select>

        <select
          id="attendance-status-filter"
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as StatusFilter);
            setLimit(INITIAL_LIMIT);
          }}
          className="w-full sm:w-48 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
        >
          <option value="all">All statuses</option>
          {Object.entries(labels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* List / Groups */}
      {visible.length === 0 ? (
        <div
          role="status"
          className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-xs"
        >
          <ClipboardCheck className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
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
                {group.rows.map((row) => {
                  const styling = statusStyles[row.status];
                  return (
                    <article
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs apple-card-hover transition-all"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-950">{row.session_title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{formatDate(row.session_date)}</p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${styling.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${styling.dot}`} />
                        <span>{labels[row.status]}</span>
                      </span>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {visible.length < filtered.length ? (
        <button
          type="button"
          onClick={() => setLimit((value) => value + INITIAL_LIMIT)}
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
        >
          Show more ({filtered.length - visible.length} remaining)
        </button>
      ) : null}
    </section>
  );
}
