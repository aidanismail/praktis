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

  let errorTitle = "Couldn't load course modules";
  let errorDescription = "Couldn't reach the server. Let's try that again.";

  if (isUnauthorized) {
    errorTitle = "You've been signed out";
    errorDescription = "Please sign in again to continue.";
  } else if (isForbidden) {
    errorTitle = "Access restricted";
    errorDescription =
      "You don't have access to course modules for this class.";
  } else if (isNotFound) {
    errorTitle = "Class not found";
    errorDescription = "This course may no longer be available.";
  } else if (isValidationError) {
    errorTitle = "Invalid course link";
    errorDescription = "Head back to the dashboard and open the course again.";
  }

  return (
    <section aria-labelledby="course-modules-heading" aria-busy={isFetching}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider
            text-slate-500"
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
              ? "Upload, publish, and organize reading materials and lab manuals."
              : "Download lab manuals, guides, and reading materials."}
          </p>
        </div>

        {hasLoadedData && !isAccessError ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="apple-press inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"}
                aria-hidden="true"
              />
              {isFetching ? "Refreshing..." : "Refresh links"}
            </button>
          </div>
        ) : null}
      </div>
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
            Loading learning materials...
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
                  Couldn&apos;t refresh download links right now. Existing links remain available.
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

          {accessMode === "manage" ? (
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Left Column: Modules list */}
              <div className="lg:col-span-7 space-y-3">
                {modules.length === 0 ? (
                  <div
                    role="status"
                    className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-center"
                  >
                    <BookOpen
                      className="mx-auto h-7 w-7 text-slate-300"
                      aria-hidden="true"
                    />
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">
                      No modules uploaded yet
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Upload lab manuals or guides using the panel on the right.
                    </p>
                  </div>
                ) : (
                  modules.map((module) => (
                    <ModuleCard
                      key={module.id}
                      userId={userId}
                      courseId={courseId}
                      module={module}
                      accessMode={accessMode}
                    />
                  ))
                )}
              </div>

              {/* Right Column: Upload panel (sticky) */}
              <div className="lg:col-span-5 lg:sticky lg:top-4">
                <ModuleUploadForm userId={userId} courseId={courseId} />
              </div>
            </div>
          ) : (
            <div className="mt-5 max-w-3xl space-y-3">
              {modules.length === 0 ? (
                <div
                  role="status"
                  className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-center"
                >
                  <BookOpen
                    className="mx-auto h-7 w-7 text-slate-300"
                    aria-hidden="true"
                  />
                  <h3 className="mt-2 text-sm font-semibold text-slate-900">
                    No modules available yet
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Lab manuals and guides will show up here once uploaded by instructors.
                  </p>
                </div>
              ) : (
                modules.map((module) => (
                  <ModuleCard
                    key={module.id}
                    userId={userId}
                    courseId={courseId}
                    module={module}
                    accessMode={accessMode}
                  />
                ))
              )}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
