"use client";

import Link from "next/link";
import { AlertCircle, Loader2, Mail, RefreshCw, Users } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useCourseRoster } from "../hooks/use-course-roster";

type CourseRosterProps = {
  userId: string;
  courseId: string;
};

export function CourseRoster({ userId, courseId }: CourseRosterProps) {
  const {
    data: students = [],
    error,
    isError,
    isFetching,
    isPending,
    refetch
  } = useCourseRoster({
    userId,
    courseId,
    enabled: true
  });

  const isUnauthorized = error instanceof ApiError && error.status === 401;
  const isForbidden = error instanceof ApiError && error.status === 403;
  const isNotFound = error instanceof ApiError && error.status === 404;

  let errorTitle = "Couldn't load student roster";
  let errorDescription = "Couldn't reach the server. Let's try that again.";

  if (isUnauthorized) {
    errorTitle = "You've been signed out";
    errorDescription = "Please sign in again to view the roster.";
  } else if (isForbidden) {
    errorTitle = "Access restricted";
    errorDescription =
      "You don't have permission to view this class roster.";
  } else if (isNotFound) {
    errorTitle = "Class not found";
    errorDescription =
      "This class might have been moved, archived, or unassigned.";
  }

  return (
    <section
      aria-labelledby="course-roster-heading"
      aria-busy={isPending || isFetching}
      className="mt-6 rounded-3xl border border-slate-200 bg-white
        p-6 shadow-sm sm:p-8"
    >
      <div
        className="flex flex-wrap items-start justify-between
        gap-4"
      >
        <div className="flex items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center
            justify-center rounded-xl bg-slate-100 text-slate-800"
          >
            <Users className="h-5 w-5" aria-hidden="true" />
          </span>

          <div>
            <h2
              id="course-roster-heading"
              className="text-xl font-semibold text-slate-950"
            >
              Class Roster
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Students currently enrolled in this practicum class.
            </p>
          </div>
        </div>

        {!isPending && !isError ? (
          <span
            aria-live="polite"
            className="rounded-full bg-slate-100 px-3 py-1 text-sm
              font-medium text-slate-700"
          >
            {students.length} {students.length === 1 ? "student" : "students"}
          </span>
        ) : null}
      </div>

      {isPending ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 flex min-h-40 items-center justify-center
            rounded-2xl border border-slate-200 bg-slate-50"
        >
          <Loader2
            className="h-5 w-5 animate-spin text-slate-900"
            aria-hidden="true"
          />
          <span className="ml-3 text-sm text-slate-600">
            Loading class roster...
          </span>
        </div>
      ) : null}

      {isError ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
              aria-hidden="true"
            />

            <div>
              <h3 className="font-semibold text-red-950">{errorTitle}</h3>
              <p className="mt-1 text-sm leading-6 text-red-800">
                {errorDescription}
              </p>

              {isUnauthorized ? (
                <Link
                  href={ROUTES.login}
                  className="mt-4 inline-flex rounded-xl bg-red-700
                    px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2
                    focus-visible:outline-red-700"
                >
                  Go to sign in
                </Link>
              ) : null}

              {isForbidden || isNotFound ? (
                <Link
                  href={ROUTES.dashboard}
                  className="mt-4 inline-flex text-sm font-medium
                    text-red-900 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2
                    focus-visible:outline-red-700"
                >
                  Return to dashboard
                </Link>
              ) : null}

              {!isUnauthorized && !isForbidden && !isNotFound ? (
                <button
                  type="button"
                  onClick={() => void refetch()}
                  disabled={isFetching}
                  className="mt-4 inline-flex items-center gap-2
                    rounded-xl bg-red-700 px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed
                    disabled:opacity-60"
                >
                  <RefreshCw
                    className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                    aria-hidden="true"
                  />
                  {isFetching ? "Retrying..." : "Try again"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {!isPending && !isError && students.length === 0 ? (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center"
        >
          <Users
            className="mx-auto h-8 w-8 text-slate-400"
            aria-hidden="true"
          />
          <h3 className="mt-3 font-semibold text-slate-950">
            No students enrolled yet
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Enrolled students will appear here once registered by your department admin.
          </p>
        </div>
      ) : null}

      {!isPending && !isError && students.length > 0 ? (
        <ul className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
          {students.map((student) => (
            <li
              key={student.id}
              className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5"
            >
              <div className="min-w-0">
                <span
                  className="text-xs font-semibold uppercase
                  tracking-wide text-slate-500"
                >
                  NPM
                </span>
                <span
                  className="mt-1 block wrap-break-words font-mono
                  text-sm font-medium text-slate-950"
                >
                  {student.username}
                </span>
              </div>

              <div className="flex min-w-0 items-start gap-2">
                <Mail
                  className="mt-1 h-4 w-4 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <span
                    className="text-xs font-semibold uppercase
                    tracking-wide text-slate-500"
                  >
                    Email
                  </span>
                  <span
                    className="mt-1 block break-all text-sm
                    text-slate-700"
                  >
                    {student.email}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
