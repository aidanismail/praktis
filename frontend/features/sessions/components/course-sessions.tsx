"use client";

import { AlertCircle, CalendarRange, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import {
  useCourseSessions,
  useCreateCourseSession,
  useTransitionSessionAttendance
} from "../hooks/use-course-sessions";
import type { SessionFormValues } from "../schemas/session.schema";
import type { CourseSession } from "../types/session.type";
import { SessionCard } from "./session-card";
import { SessionForm } from "./session-form";

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
      return "This attendance window is already in that state. Refresh the session list.";
    }

    if (error.status === 401) {
      return "Your session expired. Sign in again before changing attendance.";
    }

    if (error.status === 403) {
      return "You are not allowed to change attendance for this course.";
    }

    if (error.status === 404) {
      return "The session no longer exists. Refresh the list before retrying.";
    }

    if (error.status === 409) {
      return "Another session in this course already has an open attendance window. Close it before opening this one.";
    }

    if (error.status === 422) {
      return "The selected session link is invalid. Refresh before retrying.";
    }
  }

  return "The attendance window could not be changed because of a network or server problem.";
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

  let errorTitle = "Sessions could not be loaded";
  let errorDescription = "A network or server problem interrupted the request.";

  if (status === 401) {
    errorTitle = "Your session has expired";
    errorDescription = "Sign in again to continue.";
  } else if (status === 403) {
    errorTitle = "Session access is unavailable";
    errorDescription = "You are not assigned to manage this course.";
  } else if (status === 404) {
    errorTitle = "Course not found";
    errorDescription = "This course may no longer exist or be assigned to you.";
  } else if (status === 422) {
    errorTitle = "The course link is invalid";
    errorDescription = "Return to the dashboard and open the course again.";
  }

  return (
    <section aria-labelledby="course-sessions-heading" aria-busy={sessionsQuery.isFetching}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Meetings and attendance windows
          </p>
          <h2
            id="course-sessions-heading"
            className="mt-1 text-xl font-semibold text-slate-950"
          >
            Sessions &amp; Attendance
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Schedule meetings and control one attendance window at a time.
          </p>
        </div>

        {hasLoadedData && !accessError ? (
          <button
            type="button"
            onClick={() => void sessionsQuery.refetch()}
            disabled={sessionsQuery.isFetching}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={
                sessionsQuery.isFetching
                  ? "h-4 w-4 animate-spin"
                  : "h-4 w-4"
              }
              aria-hidden="true"
            />
            {sessionsQuery.isFetching ? "Refreshing..." : "Refresh sessions"}
          </button>
        ) : null}
      </div>

      {hasLoadedData && !accessError ? (
        <section
          aria-labelledby="create-session-heading"
          className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <h3 id="create-session-heading" className="font-semibold text-slate-950">
            Add a session
          </h3>
          <p className="mt-1 mb-4 text-sm text-slate-600">
            Past, current, and future calendar dates are supported.
          </p>
          <SessionForm
            submitLabel="Create session"
            pendingLabel="Creating..."
            isPending={createMutation.isPending}
            error={createMutation.error}
            onSubmit={createSession}
            resetAfterSubmit
          />
          {createMutation.isSuccess ? (
            <p role="status" aria-live="polite" className="mt-3 text-sm text-emerald-700">
              Session created successfully.
            </p>
          ) : null}
        </section>
      ) : null}

      {sessionsQuery.isPending ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 flex min-h-48 items-center justify-center rounded-3xl border border-slate-200 bg-white"
        >
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="ml-3 text-sm text-slate-600">Loading sessions...</span>
        </div>
      ) : null}

      {blockingError ? (
        <div role="alert" className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-red-950">{errorTitle}</h3>
              <p className="mt-1 text-sm leading-6 text-red-800">{errorDescription}</p>
              {status === 401 ? (
                <Link
                  href={ROUTES.login}
                  className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
                >
                  Go to sign in
                </Link>
              ) : accessError ? (
                <Link
                  href={ROUTES.dashboard}
                  className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-red-900 underline underline-offset-4"
                >
                  Return to dashboard
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void sessionsQuery.refetch()}
                  disabled={sessionsQuery.isFetching}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Try again
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {!sessionsQuery.isPending && !blockingError ? (
        <>
          {refreshError ? (
            <div role="alert" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              The latest sessions could not be refreshed. Existing results remain visible.
            </div>
          ) : null}

          {transitionError ? (
            <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {transitionError}
            </div>
          ) : null}

          {transitionMutation.isSuccess ? (
            <p role="status" aria-live="polite" className="mt-4 text-sm text-emerald-700">
              {transitionMutation.data.message}
            </p>
          ) : null}

          {sessions.length === 0 ? (
            <div role="status" className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <CalendarRange className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-slate-950">No sessions yet</h3>
              <p className="mt-1 text-sm text-slate-600">
                Create the first meeting for this course above.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {sessions.map((session) => (
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
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
