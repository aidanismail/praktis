"use client";

import Link from "next/link";
import { AlertCircle, BookOpen, Loader2, RefreshCw } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useCourseModules } from "../hooks/use-course-modules";
import { ModuleCard } from "./module-card";
import { ModuleUploadForm } from "./module-upload-form";
type CourseModulesProps = {
  userId: string;
  courseId: string;
  accessMode: "manage" | "read-only";
};

export function CourseModules({ userId, courseId, accessMode }: CourseModulesProps) {
  const { data, error, isError, isFetching, isPending, refetch } =
    useCourseModules({
      userId,
      courseId,
      enabled: true
    });

  const modules = (data ?? []).filter(
    (module) => accessMode === "manage" || module.is_published
  );
  const hasLoadedData = data !== undefined;

  const isUnauthorized = error instanceof ApiError && error.status === 401;
  const isForbidden = error instanceof ApiError && error.status === 403;
  const isNotFound = error instanceof ApiError && error.status === 404;
  const isValidationError = error instanceof ApiError && error.status === 422;

  const isAccessError =
    isUnauthorized || isForbidden || isNotFound || isValidationError;

  const showBlockingError = isError && (isAccessError || !hasLoadedData);

  const showRefreshError = isError && !isAccessError && hasLoadedData;

  let errorTitle = "Modules could not be loaded";
  let errorDescription = "A network or server problem interrupted the request.";

  if (isUnauthorized) {
    errorTitle = "Your session has expired";
    errorDescription = "Sign in again to continue.";
  } else if (isForbidden) {
    errorTitle = "Module access is unavailable";
    errorDescription =
      "Your account is not allowed to access modules for this course.";
  } else if (isNotFound) {
    errorTitle = "Course modules were not found";
    errorDescription = "This course may no longer exist or be assigned to you.";
  } else if (isValidationError) {
    errorTitle = "The course link is invalid";
    errorDescription = "Return to the dashboard and open the course again.";
  }

  return (
    <section aria-labelledby="course-modules-heading" aria-busy={isFetching}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider
            text-emerald-700"
          >
            Learning materials
          </p>

          <h2
            id="course-modules-heading"
            className="mt-1 text-xl font-semibold text-slate-950"
          >
            Course modules
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            {accessMode === "manage"
              ? "Draft and published materials for this practicum course."
              : "Published learning materials for this practicum course."}
          </p>
        </div>

        {hasLoadedData && !isAccessError ? (
          <div className="flex flex-wrap items-center gap-2">
            <span
              aria-live="polite"
              className="rounded-full bg-slate-100 px-3 py-1 text-sm
                  font-medium text-slate-700"
            >
              {modules.length} {modules.length === 1 ? "module" : "modules"}
            </span>

            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl
                  border border-slate-200 bg-white px-3 text-sm font-semibold
                  text-slate-700 transition hover:bg-slate-50
                  focus-visible:outline-2 focus-visible:outline-offset-2
                  focus-visible:outline-emerald-700
                  disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                aria-hidden="true"
              />

              {isFetching ? "Refreshing..." : "Refresh links"}
            </button>
          </div>
        ) : null}
      </div>
      {hasLoadedData && !isAccessError && accessMode === "manage" ? (
        <ModuleUploadForm userId={userId} courseId={courseId} />
      ) : null}
      {isPending ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 flex min-h-48 items-center justify-center
              rounded-3xl border border-slate-200 bg-white"
        >
          <Loader2
            className="h-5 w-5 animate-spin text-slate-900"
            aria-hidden="true"
          />
          <span className="ml-3 text-sm text-slate-600">
            Loading course modules...
          </span>
        </div>
      ) : null}

      {showBlockingError ? (
        <div
          role="alert"
          className="mt-5 rounded-3xl border border-red-200
              bg-red-50 p-6"
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
                  className="mt-4 inline-flex min-h-11 items-center
                      rounded-xl bg-red-700 px-4 text-sm font-semibold
                      text-white focus-visible:outline-2
                      focus-visible:outline-offset-2
                      focus-visible:outline-red-700"
                >
                  Go to sign in
                </Link>
              ) : null}

              {isForbidden || isNotFound || isValidationError ? (
                <Link
                  href={ROUTES.dashboard}
                  className="mt-4 inline-flex min-h-11 items-center
                      rounded-xl text-sm font-semibold text-red-900
                      underline underline-offset-4
                      focus-visible:outline-2
                      focus-visible:outline-offset-2
                      focus-visible:outline-red-700"
                >
                  Return to dashboard
                </Link>
              ) : null}

              {!isAccessError ? (
                <button
                  type="button"
                  onClick={() => void refetch()}
                  disabled={isFetching}
                  className="mt-4 inline-flex min-h-11 items-center
                      gap-2 rounded-xl bg-red-700 px-4 text-sm
                      font-semibold text-white
                      focus-visible:outline-2
                      focus-visible:outline-offset-2
                      focus-visible:outline-red-700
                      disabled:cursor-not-allowed disabled:opacity-60"
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

      {!isPending && !showBlockingError ? (
        <>
          {showRefreshError ? (
            <div
              role="alert"
              className="mt-5 flex flex-wrap items-center
                  justify-between gap-3 rounded-2xl border
                  border-amber-200 bg-amber-50 px-4 py-3"
            >
              <div className="flex items-start gap-2">
                <AlertCircle
                  className="mt-0.5 h-4 w-4 shrink-0
                      text-amber-700"
                  aria-hidden="true"
                />

                <p className="text-sm text-amber-900">
                  The latest module links could not be refreshed. Existing
                  results remain visible.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
                className="inline-flex min-h-11 items-center gap-2
                    rounded-xl px-3 text-sm font-semibold
                    text-amber-950 underline underline-offset-4
                    focus-visible:outline-2
                    focus-visible:outline-offset-2
                    focus-visible:outline-amber-700
                    disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                  aria-hidden="true"
                />
                Retry refresh
              </button>
            </div>
          ) : null}

          {isFetching && !showRefreshError ? (
            <p
              role="status"
              aria-live="polite"
              className="mt-3 text-sm text-slate-500"
            >
              Refreshing module links...
            </p>
          ) : null}

          {modules.length === 0 ? (
            <div
              role="status"
              className="mt-5 rounded-3xl border border-dashed
                  border-slate-300 bg-white px-6 py-12 text-center"
            >
              <BookOpen
                className="mx-auto h-9 w-9 text-slate-400"
                aria-hidden="true"
              />

              <h3 className="mt-3 font-semibold text-slate-950">
                No modules yet
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Learning materials uploaded for this course will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {modules.map((module) => (
                <ModuleCard
                  key={module.id}
                  userId={userId}
                  courseId={courseId}
                  module={module}
                  accessMode={accessMode}
                />
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
