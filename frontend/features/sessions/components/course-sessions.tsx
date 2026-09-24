"use client";

import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { NotificationBanner } from "@/components/ui/notification-banner";
import {
  useCourseSessions,
  useCreateCourseSession,
  useTransitionSessionAttendance
} from "../hooks/use-course-sessions";
import type { SessionFormValues } from "../schemas/session.schema";
import type { CourseSession } from "../types/session.type";
import { SessionCard } from "./session-card";
import { SessionForm } from "./session-form";
import {
  CalendarDots,
  ArrowsClockwise
} from "@phosphor-icons/react";

type CourseSessionsProps = {
  userId: string;
  courseId: string;
};

function sortSessions(sessions: CourseSession[]) {
  return [...sessions].sort((left, right) => {
    const byDate = left.date.localeCompare(right.date);

    if (byDate !== 0) {
      return byDate;
    }

    const byTitle = left.title.localeCompare(right.title, undefined, {
      sensitivity: "base"
    });

    return byTitle !== 0 ? byTitle : left.id.localeCompare(right.id);
  });
}

function getTransitionError(error: Error | null) {
  if (!error) {
    return null;
  }

  if (error instanceof ApiError) {
    if (error.status === 400) {
      return "This attendance window is already in that state. Refreshing list...";
    }

    if (error.status === 401) {
      return "You've been signed out. Please sign in again.";
    }

    if (error.status === 403) {
      return "You don't have permission to change attendance for this course.";
    }

    if (error.status === 404) {
      return "This session couldn't be found. Try refreshing the page.";
    }

    if (error.status === 409) {
      return "Another session currently has an open attendance window. Close it before opening this one.";
    }

    if (error.status === 422) {
      return "Invalid session link. Please refresh and try again.";
    }
  }

  return "Couldn't update attendance window. Let's try that again.";
}

export function CourseSessions({ userId, courseId }: CourseSessionsProps) {
  const sessionsQuery = useCourseSessions({
    userId,
    courseId,
    enabled: true
  });
  const createMutation = useCreateCourseSession({ userId, courseId });
  const transitionMutation = useTransitionSessionAttendance({
    userId,
    courseId
  });

  const sessions = sortSessions(sessionsQuery.data ?? []);
  const hasLoadedData = sessionsQuery.data !== undefined;
  const error = sessionsQuery.error;
  const status = error instanceof ApiError ? error.status : null;
  const accessError =
    status === 401 || status === 403 || status === 404 || status === 422;
  const blockingError =
    sessionsQuery.isError && (accessError || !hasLoadedData);
  const refreshError =
    sessionsQuery.isError && !accessError && hasLoadedData;
  const transitionError = getTransitionError(transitionMutation.error);

  async function createSession(values: SessionFormValues) {
    createMutation.reset();

    try {
      await createMutation.mutateAsync(values);
      return true;
    } catch {
      return false;
    }
  }

  function transitionSession(sessionId: string, action: "open" | "close") {
    transitionMutation.reset();
    transitionMutation.mutate({ sessionId, action });
  }

  let errorTitle = "Couldn't load class sessions";
  let errorDescription = "Couldn't reach the server. Let's try that again.";

  if (status === 401) {
    errorTitle = "You've been signed out";
    errorDescription = "Please sign in again to continue.";
  } else if (status === 403) {
    errorTitle = "Access restricted";
    errorDescription = "You aren't assigned to manage this course.";
  } else if (status === 404) {
    errorTitle = "Class not found";
    errorDescription = "This class might have been removed or reassigned.";
  } else if (status === 422) {
    errorTitle = "Invalid course link";
    errorDescription = "Return to dashboard and try again.";
  }

  return (
    <section aria-labelledby="course-sessions-heading" aria-busy={sessionsQuery.isFetching}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Schedule &amp; attendance
          </p>
          <h2
            id="course-sessions-heading"
            className="mt-1 text-xl font-semibold text-slate-950"
          >
            Sessions &amp; Attendance
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Schedule meetings, manage attendance windows, and record grades.
          </p>
        </div>

        {hasLoadedData && !accessError ? (
          <button
            type="button"
            onClick={() => void sessionsQuery.refetch()}
            disabled={sessionsQuery.isFetching}
            className="apple-press inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowsClockwise
              className={
                sessionsQuery.isFetching
                  ? "h-3.5 w-3.5 animate-spin"
                  : "h-3.5 w-3.5"
              }
              aria-hidden="true"
            />
            {sessionsQuery.isFetching ? "Refreshing..." : "Refresh sessions"}
          </button>
        ) : null}
      </div>

      {sessionsQuery.isPending ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 flex min-h-48 items-center justify-center rounded-3xl border border-slate-200 bg-white"
        >
          <AsteriskLoader className="h-5 w-5 text-slate-900" aria-hidden="true" />
          <span className="ml-3 text-sm text-slate-600">Loading class sessions...</span>
        </div>
      ) : null}

      {blockingError ? (
        <div className="mt-5">
          <NotificationBanner variant="error">
            <div>
              <h3 className="font-semibold text-white">{errorTitle}</h3>
              <p className="mt-1 text-xs text-slate-300">{errorDescription}</p>
              {status === 401 ? (
                <Link
                  href={ROUTES.login}
                  className="mt-3 inline-flex min-h-9 items-center rounded-lg bg-slate-800 border border-slate-700 px-3 text-xs font-semibold text-white hover:bg-slate-700 transition"
                >
                  Go to sign in
                </Link>
              ) : accessError ? (
                <Link
                  href={ROUTES.dashboard}
                  className="mt-3 inline-flex min-h-9 items-center text-xs font-semibold text-slate-300 underline underline-offset-4 hover:text-white"
                >
                  Return to dashboard
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void sessionsQuery.refetch()}
                  disabled={sessionsQuery.isFetching}
                  className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 text-xs font-semibold text-white hover:bg-slate-700 transition disabled:opacity-60"
                >
                  <ArrowsClockwise className={sessionsQuery.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} aria-hidden="true" />
                  Try again
                </button>
              )}
            </div>
          </NotificationBanner>
        </div>
      ) : null}

      {!sessionsQuery.isPending && !blockingError ? (
        <>
          {refreshError ? (
            <div className="mt-5">
              <NotificationBanner
                variant="warning"
                message="Couldn't refresh sessions right now. Showing previous schedule."
              />
            </div>
          ) : null}

          {transitionError ? (
            <div className="mt-5">
              <NotificationBanner
                variant="error"
                message={transitionError}
              />
            </div>
          ) : null}

          {transitionMutation.isSuccess ? (
            <div className="mt-4">
              <NotificationBanner
                variant="success"
                message={transitionMutation.data.message}
              />
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Sessions list */}
            <div className="lg:col-span-7 space-y-3">
              {sessions.length === 0 ? (
                <div role="status" className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-center">
                  <CalendarDots className="mx-auto h-7 w-7 text-slate-300" aria-hidden="true" />
                  <h3 className="mt-2 text-sm font-semibold text-slate-900">No sessions scheduled yet</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Use the panel on the right to schedule your first lab session.
                  </p>
                </div>
              ) : (
                sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    userId={userId}
                    courseId={courseId}
                    session={session}
                    transitionPending={transitionMutation.isPending}
                    transitioningSessionId={
                      transitionMutation.variables?.sessionId ?? null
                    }
                    onTransition={transitionSession}
                  />
                ))
              )}
            </div>

            {/* Right Column: Schedule a session panel (sticky) */}
            <div className="lg:col-span-5 lg:sticky lg:top-4">
              <section
                aria-labelledby="create-session-heading"
                className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs"
              >
                <div>
                  <h3 id="create-session-heading" className="text-sm font-bold tracking-tight text-slate-950">
                    Schedule session
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Set up a lab date and topic for your students.
                  </p>
                </div>
                <div className="mt-4">
                  <SessionForm
                    submitLabel="Schedule session"
                    pendingLabel="Scheduling..."
                    isPending={createMutation.isPending}
                    error={createMutation.error}
                    onSubmit={createSession}
                    resetAfterSubmit
                    compact
                  />
                </div>
                {createMutation.isSuccess ? (
                  <div className="mt-3">
                    <NotificationBanner variant="success" message="Session scheduled!" />
                  </div>
                ) : null}
              </section>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
