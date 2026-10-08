"use client";

import { useMemo } from "react";
import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { formatCalendarDate } from "@/lib/format/date";
import { averagePercent, formatScore } from "@/lib/format/score";
import { usePersonalGrades } from "../hooks/use-personal-grades";
import {
  GraduationCapIcon,
  ArrowsClockwiseIcon,
  ChatTextIcon
} from "@phosphor-icons/react";

type Props = {
  userId: string;
  courseId: string;
};

export function PraktikanCourseGrades({ userId, courseId }: Props) {
  const gradesQuery = usePersonalGrades(userId);

  const assignmentGrades = useMemo(
    () =>
      (gradesQuery.data ?? []).filter(
        (g) => g.course_id === courseId && g.item_type === "assignment"
      ),
    [gradesQuery.data, courseId]
  );

  const average = useMemo(() => averagePercent(assignmentGrades), [assignmentGrades]);

  if (gradesQuery.isPending) {
    return (
      <div
        role="status"
        className="flex min-h-40 items-center justify-center rounded-3xl border border-slate-200 bg-white"
      >
        <AsteriskLoader className="h-5 w-5 text-slate-400" aria-hidden="true" />
        <span className="ml-3 text-xs font-medium text-slate-600">Loading your grades...</span>
      </div>
    );
  }

  if (gradesQuery.isError) {
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
            onClick={() => void gradesQuery.refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition disabled:opacity-60 shrink-0"
          >
            <ArrowsClockwiseIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Try again
          </button>
        </div>
      </NotificationBanner>
    );
  }

  return (
    <section aria-labelledby="course-grades-heading" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Course Performance</p>
          <h2 id="course-grades-heading" className="mt-1 text-xl font-bold tracking-tight text-slate-950">
            My Assignment Scores
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Scores and feedback appear here once your teaching assistants publish them.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void gradesQuery.refetch()}
          disabled={gradesQuery.isFetching}
          className="p-2 self-start sm:self-auto rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          title="Refresh grades"
          aria-label="Refresh grades"
        >
          <ArrowsClockwiseIcon
            className={`w-3.5 h-3.5 ${gradesQuery.isFetching ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <dt className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Graded Assignments</dt>
          <dd className="mt-1 text-2xl font-bold text-slate-950">{assignmentGrades.length}</dd>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <dt className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Average</dt>
          <dd className="mt-1 text-2xl font-bold text-slate-950">
            {average === null ? "—" : `${formatScore(average)}%`}
          </dd>
        </div>
      </dl>

      {assignmentGrades.length === 0 ? (
        <div
          role="status"
          className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-xs"
        >
          <GraduationCapIcon className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <h3 className="mt-3 text-sm font-bold text-slate-950">No published scores yet</h3>
          <p className="mt-1 text-xs text-slate-500">
            Assignment scores will show up here after they are graded and published.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {assignmentGrades.map((assignment) => (
            <article
              key={assignment.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs apple-card-hover transition-all flex flex-col justify-between gap-3"
            >
              <div>
                <h3 className="text-xs font-bold text-slate-950">{assignment.session_title}</h3>
                {assignment.session_date && (
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Due {formatCalendarDate(assignment.session_date)}
                  </p>
                )}
                {assignment.feedback && (
                  <p className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-start gap-1.5">
                    <ChatTextIcon className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="whitespace-pre-wrap wrap-break-word">&ldquo;{assignment.feedback}&rdquo;</span>
                  </p>
                )}
              </div>

              <div className="flex items-baseline justify-between border-t border-slate-100 pt-2.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Score
                </span>
                <span className="text-base font-bold text-slate-950 font-mono">
                  {formatScore(assignment.score)}
                  <span className="text-xs font-normal text-slate-400"> / {assignment.max_points}</span>
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
