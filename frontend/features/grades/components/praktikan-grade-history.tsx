"use client";

import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import { useMemo, useState } from "react";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { ApiError } from "@/lib/api/client";
import { formatCalendarDate } from "@/lib/format/date";
import { averagePercent, formatScore } from "@/lib/format/score";
import { usePersonalGrades } from "../hooks/use-personal-grades";
import type { PersonalGradeHistoryItem } from "../types/grade.type";
import {
  GraduationCapIcon,
  ArrowsClockwiseIcon
} from "@phosphor-icons/react";

type Props = { userId: string };
const INITIAL_LIMIT = 60;

function sortRows(rows: PersonalGradeHistoryItem[]) {
  return [...rows].sort(
    (a, b) =>
      (b.session_date ?? "").localeCompare(a.session_date ?? "") ||
      a.session_title.localeCompare(b.session_title)
  );
}

export function PraktikanGradeHistory({ userId }: Props) {
  const query = usePersonalGrades(userId);
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
    rows.filter((row) => courseFilter === "all" || row.course_id === courseFilter)
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
      }, new Map<string, { key: string; title: string; period: string; rows: PersonalGradeHistoryItem[] }>())
      .values()
  );

  const average = averagePercent(filtered);

  if (query.isPending) {
    return (
      <div
        role="status"
        className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white"
      >
        <AsteriskLoader className="h-5 w-5 text-slate-400" aria-hidden="true" />
        <span className="ml-3 text-xs font-medium text-slate-600">Loading your grades...</span>
      </div>
    );
  }

  if (query.isError) {
    const status = query.error instanceof ApiError ? query.error.status : null;
    return (
      <NotificationBanner variant="error">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div>
            <h3 className="font-semibold text-white">Couldn&apos;t load grades</h3>
            <p className="mt-0.5 text-xs text-slate-300">
              {status === 401
                ? "You've been signed out. Please sign in again."
                : "Couldn't reach the server to load your grades. Let's try that again."}
            </p>
          </div>
          {status !== 401 ? (
            <button
              type="button"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition disabled:opacity-60 shrink-0"
            >
              <ArrowsClockwiseIcon className={`h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
              Try again
            </button>
          ) : null}
        </div>
      </NotificationBanner>
    );
  }

  return (
    <section aria-labelledby="grade-history-heading" aria-busy={query.isFetching} className="space-y-6">
      <h2 id="grade-history-heading" className="sr-only">
        Grade history
      </h2>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Refresh grades"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
          className="p-2 self-start sm:self-auto rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          title="Refresh grades"
        >
          <ArrowsClockwiseIcon className={`w-3.5 h-3.5 ${query.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
        </button>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <dt className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Graded Items</dt>
          <dd className="mt-1 text-2xl sm:text-3xl font-bold text-slate-950">{filtered.length}</dd>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <dt className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Current Average</dt>
          <dd className="mt-1 text-2xl sm:text-3xl font-bold text-slate-950">
            {average === null ? "—" : `${formatScore(average)}%`}
          </dd>
        </div>
      </dl>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          id="grade-course-filter"
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
      </div>

      {visible.length === 0 ? (
        <div
          role="status"
          className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-xs"
        >
          <GraduationCapIcon className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 text-sm font-bold text-slate-950">No grades published yet</h2>
          <p className="mt-1 text-xs text-slate-500">
            Once your instructors publish session or assignment scores, they&apos;ll show up right here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group, index) => (
            <section key={group.key} aria-labelledby={`grade-group-${index}`} className="space-y-3">
              <div>
                <h2 id={`grade-group-${index}`} className="text-sm font-bold text-slate-950">
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
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-950">{row.session_title}</p>
                        {row.item_type ? (
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                              row.item_type === "assignment"
                                ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {row.item_type === "assignment" ? "Assignment" : "Session"}
                          </span>
                        ) : null}
                      </div>
                      {row.session_date ? (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {row.item_type === "assignment" ? "Due " : ""}
                          {formatCalendarDate(row.session_date)}
                        </p>
                      ) : null}
                      {row.feedback ? (
                        <p className="text-[11px] text-slate-600 mt-1 italic">
                          Feedback: &ldquo;{row.feedback}&rdquo;
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        {row.item_type === "assignment" ? "Score" : "Session score"}
                      </span>
                      <span className="text-base font-bold text-slate-950 font-mono">
                        {formatScore(row.score)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        / {row.max_points || 100}
                      </span>
                    </div>
                  </article>
                ))}
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
          Show {filtered.length - visible.length} more
        </button>
      ) : null}
    </section>
  );
}
