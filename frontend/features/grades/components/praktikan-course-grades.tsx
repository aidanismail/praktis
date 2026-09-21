"use client";

import { GraduationCap, RefreshCw } from "lucide-react";
import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { useCourseSessions } from "@/features/sessions/hooks/use-course-sessions";
import { usePersonalGrades } from "../hooks/use-personal-grades";

type Props = { userId: string; courseId: string };

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : dateFormatter.format(date);
}

function formatScore(value: number) {
  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function PraktikanCourseGrades({ userId, courseId }: Props) {
  const query = usePersonalGrades(userId);
  const sessionsQuery = useCourseSessions({ userId, courseId, enabled: true });

  if (query.isPending || sessionsQuery.isPending) {
    return (
      <div
        role="status"
        className="flex min-h-40 items-center justify-center rounded-3xl border border-slate-200 bg-white"
      >
        <AsteriskLoader className="h-5 w-5 text-slate-400" aria-hidden="true" />
        <span className="ml-3 text-xs font-medium text-slate-600">Loading grades...</span>
      </div>
    );
  }

  if (query.isError || sessionsQuery.isError) {
    return (
      <NotificationBanner variant="error">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div>
            <h3 className="font-semibold text-white">Couldn&apos;t load grades for this class</h3>
            <p className="mt-0.5 text-xs text-slate-300">
              Something went wrong while retrieving published grades. Please try again.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void query.refetch();
              void sessionsQuery.refetch();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition disabled:opacity-60 shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Try again
          </button>
        </div>
      </NotificationBanner>
    );
  }

  const rows = new Map(
    (query.data ?? []).filter((row) => row.course_id === courseId).map((row) => [row.session_id, row])
  );
  const sessions = [...(sessionsQuery.data ?? [])].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section aria-labelledby="course-grades-heading" className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Course Performance</p>
        <h2 id="course-grades-heading" className="mt-1 text-xl font-bold tracking-tight text-slate-950">
          Grades &amp; Scores
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Scores are displayed once published by your instructors.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div
          role="status"
          className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-xs"
        >
          <GraduationCap className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <h3 className="mt-3 text-sm font-bold text-slate-950">No graded sessions yet</h3>
          <p className="mt-1 text-xs text-slate-500">
            Session scores will appear here once they&apos;re published.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sessions.map((session) => {
            const row = rows.get(session.id);
            return (
              <article
                key={session.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs apple-card-hover transition-all flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-950">{session.title}</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">{formatDate(session.date)}</p>
                </div>

                {!session.grades_published ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 shrink-0">
                    Not released yet
                  </span>
                ) : row ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Score
                    </span>
                    <span className="rounded-full bg-slate-900 text-white px-3.5 py-1 text-xs font-bold shadow-xs">
                      {formatScore(row.score)}
                    </span>
                  </div>
                ) : (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 shrink-0">
                    No score recorded
                  </span>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
