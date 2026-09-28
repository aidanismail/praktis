"use client";

<<<<<<< HEAD
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
=======
import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import { NotificationBanner } from "@/components/ui/notification-banner";
>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
import { useCourseSessions } from "@/features/sessions/hooks/use-course-sessions";
import { usePersonalGrades } from "../hooks/use-personal-grades";
import {
  GraduationCap,
  ArrowsClockwise
} from "@phosphor-icons/react";

type Props = { userId: string; courseId: string };

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : dateFormatter.format(date);
}

function formatScore(value: number) {
<<<<<<< HEAD
  return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
=======
  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
}

export function PraktikanCourseGrades({ userId, courseId }: Props) {
  const query = usePersonalGrades(userId);
  const sessionsQuery = useCourseSessions({ userId, courseId, enabled: true });

  if (query.isPending || sessionsQuery.isPending) {
    return (
<<<<<<< HEAD
      <div role="status" className="flex min-h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span className="ml-3 text-sm text-slate-600">Loading grades...</span>
=======
      <div
        role="status"
        className="flex min-h-40 items-center justify-center rounded-3xl border border-slate-200 bg-white"
      >
        <AsteriskLoader className="h-5 w-5 text-slate-400" aria-hidden="true" />
        <span className="ml-3 text-xs font-medium text-slate-600">Loading grades...</span>
>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
      </div>
    );
  }

  if (query.isError || sessionsQuery.isError) {
    return (
<<<<<<< HEAD
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
        <h2 className="mt-3 font-semibold text-red-950">Couldn&apos;t load grades for this class</h2>
        <button
          type="button"
          onClick={() => {
            void query.refetch();
            void sessionsQuery.refetch();
          }}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      </div>
=======
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
            <ArrowsClockwise className="h-3.5 w-3.5" aria-hidden="true" />
            Try again
          </button>
        </div>
      </NotificationBanner>
>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
    );
  }

  const rows = new Map(
<<<<<<< HEAD
    (query.data ?? [])
      .filter((row) => row.course_id === courseId)
      .map((row) => [row.session_id, row])
  );

  const sessions = [...(sessionsQuery.data ?? [])].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section aria-labelledby="course-grades-heading">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Course performance</p>
        <h2 id="course-grades-heading" className="mt-1 text-xl font-semibold text-slate-950">
          Grades &amp; scores
        </h2>
        <p className="mt-1 text-sm text-slate-600">Scores are displayed once published by your instructors.</p>
      </div>

      {sessions.length === 0 ? (
        <div role="status" className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <h3 className="font-semibold text-slate-950">No graded sessions yet</h3>
          <p className="mt-1 text-sm text-slate-500">Session scores will appear here once they&apos;re published.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {sessions.map((session) => {
            const row = rows.get(session.id);
            return (
              <article key={session.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-950">{session.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(session.date)}</p>
                  </div>

                  <div className="text-right">
                    {!session.grades_published ? (
                      <span className="text-xs font-medium text-slate-400">Not released yet</span>
                    ) : row ? (
                      <span className="text-xl font-bold text-slate-900">{formatScore(row.score)}</span>
                    ) : (
                      <span className="text-xs font-medium text-amber-700">No score recorded</span>
                    )}
                  </div>
                </div>
=======
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
                  <span className="text-xs font-medium text-slate-400 shrink-0">
                    Not released yet
                  </span>
                ) : row ? (
                  <div className="flex items-baseline gap-1.5 shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Score
                    </span>
                    <span className="text-base font-bold text-slate-950 font-mono">
                      {formatScore(row.score)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-amber-700 shrink-0">
                    No score recorded
                  </span>
                )}
>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
