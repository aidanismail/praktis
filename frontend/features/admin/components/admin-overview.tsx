"use client";

import Link from "next/link";
import {
  Activity,
  AlertCircle,
  BookOpen,
  ChevronRight,
  FileText,
  RefreshCw,
  UploadCloud,
  Users
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import type { Course } from "@/features/courses/types/course.type";
import { ApiError } from "@/lib/api/client";
import { useAdminOverview } from "../hooks/use-admin-overview";

type AdminSectionId = "courses" | "users" | "bulk-import" | "modules";

type AdminOverviewProps = {
  userId: string;
  onNavigateToCourse: (courseId: string) => void;
  onNavigateToNavItem: (itemId: AdminSectionId) => void;
};

type SummaryMetricProps = {
  label: string;
  value: number;
  helper: string;
  isPending: boolean;
  isUnavailable: boolean;
  onRetry?: () => void;
};

type InlineDataErrorProps = {
  title: string;
  message: string;
  onRetry?: () => void;
};

type StatusTone = "positive" | "warning" | "negative" | "neutral";

type StatusRowProps = {
  label: string;
  value: string;
  tone: StatusTone;
};

const SEMESTER_ORDER: Record<Course["semester"], number> = {
  Ganjil: 0,
  Genap: 1
};

const ADMIN_AREAS = [
  {
    id: "courses",
    label: "Course management",
    description: "Offerings, rosters, and teaching staff",
    icon: BookOpen
  },
  {
    id: "users",
    label: "User accounts",
    description: "Roles, access, and password resets",
    icon: Users
  },
  {
    id: "bulk-import",
    label: "Bulk import",
    description: "Create Praktikan accounts from a file",
    icon: UploadCloud
  },
  {
    id: "modules",
    label: "Module management",
    description: "Learning files and publication state",
    icon: FileText
  }
] as const;

function sortActiveCourses(courses: Course[]) {
  return [...courses]
    .filter((course) => course.is_active)
    .sort((first, second) => {
      const yearComparison = second.academic_year.localeCompare(
        first.academic_year
      );

      if (yearComparison !== 0) {
        return yearComparison;
      }

      const semesterComparison =
        SEMESTER_ORDER[first.semester] - SEMESTER_ORDER[second.semester];

      if (semesterComparison !== 0) {
        return semesterComparison;
      }

      return first.code.localeCompare(second.code);
    });
}

function isAccessError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError && (error.status === 401 || error.status === 403)
  );
}

function canRetryError(error: unknown) {
  return !isAccessError(error);
}

function getToneClass(tone: StatusTone) {
  switch (tone) {
    case "positive":
      return "bg-emerald-500";
    case "warning":
      return "bg-amber-500";
    case "negative":
      return "bg-red-500";
    default:
      return "bg-slate-400";
  }
}

function formatCheckedTime(timestamp: number) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(timestamp);
}

function SummaryMetric({
  label,
  value,
  helper,
  isPending,
  isUnavailable,
  onRetry
}: SummaryMetricProps) {
  return (
    <div className="min-w-0 p-5 sm:p-6">
      <dt className="text-sm font-medium text-slate-600">{label}</dt>

      {isPending ? (
        <dd className="mt-3" aria-hidden="true">
          <span className="block h-9 w-20 animate-pulse rounded bg-slate-200" />
          <span
            className="mt-2 block h-4 w-32 animate-pulse rounded bg-slate-
            100"
          />
        </dd>
      ) : isUnavailable ? (
        <dd className="mt-3">
          <p className="text-lg font-semibold text-slate-700">Unavailable</p>
          <p className="mt-1 text-sm text-slate-500">
            This value could not be loaded.
          </p>

          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 text-sm font-semibold text-slate-700 underline-
                offset-4 hover:text-slate-950 hover:underline focus-
                visible:outline-2 focus-visible:outline-offset-2 focus-
                visible:outline-slate-900"
            >
              Retry
            </button>
          ) : null}
        </dd>
      ) : (
        <dd className="mt-3">
          <p className="text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-sm text-slate-500">{helper}</p>
        </dd>
      )}
    </div>
  );
}

function InlineDataError({ title, message, onRetry }: InlineDataErrorProps) {
  return (
    <div role="alert" className="p-6">
      <div className="flex items-start gap-3">
        <AlertCircle
          className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
          aria-hidden="true"
        />

        <div>
          <h4 className="font-semibold text-slate-950">{title}</h4>
          <p className="mt-1 text-sm leading-6 text-slate-600">{message}</p>

          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border
                border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-
                slate-800 transition hover:bg-slate-50 focus-visible:outline-2
                focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value, tone }: StatusRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd
        className="flex items-center gap-2 text-sm font-medium text-slate-
        900"
      >
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${getToneClass(tone)}`}
          aria-hidden="true"
        />
        {value}
      </dd>
    </div>
  );
}

export function AdminOverview({
  userId,
  onNavigateToCourse,
  onNavigateToNavItem
}: AdminOverviewProps) {
  const { coursesQuery, usersQuery, healthQuery, refreshAll, isRefreshing } =
    useAdminOverview(userId);

  const courses = coursesQuery.data ?? [];
  const users = usersQuery.data ?? [];

  const activeCourses = sortActiveCourses(courses);
  const visibleCourses = activeCourses.slice(0, 6);
  const remainingCourseCount = Math.max(
    activeCourses.length - visibleCourses.length,
    0
  );

  const praktikanUsers = users.filter((user) => user.role === "praktikan");
  const activePraktikanCount = praktikanUsers.filter(
    (user) => user.is_active
  ).length;

  const asprakUsers = users.filter((user) => user.role === "asprak");
  const activeAsprakCount = asprakUsers.filter((user) => user.is_active).length;

  const coursesUnavailable =
    coursesQuery.isError && coursesQuery.data === undefined;
  const usersUnavailable = usersQuery.isError && usersQuery.data === undefined;

  const accessError = [coursesQuery.error, usersQuery.error].find(
    isAccessError
  );

  const hasRefreshError =
    coursesQuery.isRefetchError || usersQuery.isRefetchError;

  const isInitialLoading =
    coursesQuery.isPending || usersQuery.isPending || healthQuery.isPending;

  const health = healthQuery.data;

  const platformLabel =
    health?.status === "ok"
      ? "Operational"
      : health?.status === "degraded"
        ? "Needs attention"
        : "Unreachable";

  const platformTone: StatusTone =
    health?.status === "ok"
      ? "positive"
      : health?.status === "degraded"
        ? "warning"
        : "negative";

  const courseRetry = canRetryError(coursesQuery.error)
    ? () => {
        void coursesQuery.refetch();
      }
    : undefined;

  const userRetry = canRetryError(usersQuery.error)
    ? () => {
        void usersQuery.refetch();
      }
    : undefined;

  return (
    <div className="space-y-8">
      {isInitialLoading ? (
        <p role="status" className="sr-only">
          Loading the Superadmin overview.
        </p>
      ) : null}

      {accessError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
              aria-hidden="true"
            />

            <div>
              <h3 className="font-semibold text-red-950">
                {accessError.status === 401
                  ? "Your session has expired"
                  : "Superadmin overview access is unavailable"}
              </h3>

              <p className="mt-1 text-sm leading-6 text-red-800">
                {accessError.status === 401
                  ? "Sign in again before loading administrative data."
                  : "Verify that this account still has the Superadmin role."}
              </p>

              {accessError.status === 401 ? (
                <Link
                  href={ROUTES.login}
                  className="mt-3 inline-flex rounded-lg bg-red-700 px-4 py-2
                    text-sm font-semibold text-white transition hover:bg-red-800
                    focus-visible:outline-2 focus-visible:outline-offset-2 focus-
                    visible:outline-red-700"
                >
                  Go to sign in
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {hasRefreshError && !accessError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-
            amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-
            between"
        >
          <p className="text-sm leading-6">
            Some values could not be refreshed. The last successfully loaded
            data remains visible.
          </p>

          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={isRefreshing}
            className="shrink-0 text-sm font-semibold underline-offset-4
              hover:underline focus-visible:outline-2 focus-visible:outline-
              offset-2 focus-visible:outline-amber-800 disabled:cursor-not-allowed
              disabled:opacity-60"
          >
            Retry refresh
          </button>
        </div>
      ) : null}

      <section aria-labelledby="operational-summary-heading">
        <div
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-
          between"
        >
          <div>
            <h3
              id="operational-summary-heading"
              className="text-lg font-semibold text-slate-950"
            >
              Operational summary
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Current course offerings and active account coverage.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={isRefreshing}
            className="inline-flex min-h-10 items-center justify-center gap-2
              self-start rounded-lg border border-slate-300 bg-white px-4 py-2
              text-sm font-semibold text-slate-800 transition hover:bg-slate-50
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-
              visible:outline-slate-900 disabled:cursor-not-allowed
              disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            {isInitialLoading
              ? "Loading data"
              : isRefreshing
                ? "Refreshing"
                : "Refresh data"}
          </button>
        </div>

        <dl
          className="mt-4 grid overflow-hidden rounded-2xl border border-slate-
            200 bg-white divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x
            sm:divide-y-0"
          aria-busy={isInitialLoading}
        >
          <SummaryMetric
            label="Active offerings"
            value={activeCourses.length}
            helper={`${courses.length} total course offerings`}
            isPending={coursesQuery.isPending}
            isUnavailable={coursesUnavailable}
            onRetry={courseRetry}
          />

          <SummaryMetric
            label="Active Praktikan"
            value={activePraktikanCount}
            helper={`${praktikanUsers.length} total Praktikan accounts`}
            isPending={usersQuery.isPending}
            isUnavailable={usersUnavailable}
            onRetry={userRetry}
          />

          <SummaryMetric
            label="Active Asprak"
            value={activeAsprakCount}
            helper={`${asprakUsers.length} total Asprak accounts`}
            isPending={usersQuery.isPending}
            isUnavailable={usersUnavailable}
            onRetry={userRetry}
          />
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section
          aria-labelledby="active-offerings-heading"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-
            white lg:col-span-2"
        >
          <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
            <div>
              <h3
                id="active-offerings-heading"
                className="text-lg font-semibold text-slate-950"
              >
                Active course offerings
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Open a current practicum workspace or continue to full course
                management.
              </p>
            </div>

            {!coursesUnavailable && courses.length > 0 ? (
              <button
                type="button"
                onClick={() => onNavigateToNavItem("courses")}
                className="hidden shrink-0 items-center gap-1 text-sm font-
                  semibold text-slate-700 underline-offset-4 hover:text-slate-950
                  hover:underline focus-visible:outline-2 focus-visible:outline-
                  offset-2 focus-visible:outline-slate-900 sm:inline-flex"
              >
                View all
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <div className="border-t border-slate-200">
            {coursesQuery.isPending ? (
              <div
                role="status"
                className="space-y-3 p-5 sm:p-6"
                aria-label="Loading active course offerings"
              >
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-16 animate-pulse rounded-lg bg-slate-100"
                    aria-hidden="true"
                  />
                ))}
              </div>
            ) : coursesUnavailable ? (
              <InlineDataError
                title="Course data is unavailable"
                message={
                  accessError
                    ? "Administrative course access could not be confirmed."
                    : "A network or server problem interrupted the course request."
                }
                onRetry={courseRetry}
              />
            ) : courses.length === 0 ? (
              <div role="status" className="p-6 sm:p-8">
                <BookOpen
                  className="h-7 w-7 text-slate-400"
                  aria-hidden="true"
                />
                <h4 className="mt-4 font-semibold text-slate-950">
                  No course offerings yet
                </h4>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Create the first academic-period course offering from Course
                  Management.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateToNavItem("courses")}
                  className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm
                    font-semibold text-white transition hover:bg-slate-800 focus-
                    visible:outline-2 focus-visible:outline-offset-2 focus-
                    visible:outline-slate-900"
                >
                  Open Course Management
                </button>
              </div>
            ) : visibleCourses.length === 0 ? (
              <div role="status" className="p-6 sm:p-8">
                <BookOpen
                  className="h-7 w-7 text-slate-400"
                  aria-hidden="true"
                />
                <h4 className="mt-4 font-semibold text-slate-950">
                  No active offerings
                </h4>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  {courses.length} historical{" "}
                  {courses.length === 1 ? "offering is" : "offerings are"} still
                  available in Course Management.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateToNavItem("courses")}
                  className="mt-4 rounded-lg border border-slate-300 bg-white
                    px-4 py-2 text-sm font-semibold text-slate-800 transition
                    hover:bg-slate-50 focus-visible:outline-2 focus-
                    visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  View historical offerings
                </button>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-slate-100">
                  {visibleCourses.map((course) => (
                    <li key={course.id}>
                      <button
                        type="button"
                        onClick={() => onNavigateToCourse(course.id)}
                        aria-label={`Open ${course.code}, ${course.name},
                          academic year ${course.academic_year}, semester
                          ${course.semester}`}
                        className="group flex min-h-20 w-full items-center
                          justify-between gap-4 px-5 py-4 text-left transition
                          hover:bg-slate-50 focus-visible:z-10 focus-
                          visible:outline-2 focus-visible:outline-t-[-2px]
                          focus-visible:outline-slate-900 sm:px-6"
                      >
                        <span
                          className="flex min-w-0 items-center gap-3 sm:gap-
                          5"
                        >
                          <span
                            className="w-16 shrink-0 font-mono text-sm font-
                            semibold text-slate-700"
                          >
                            {course.code}
                          </span>

                          <span className="min-w-0">
                            <span
                              className="block truncate text-sm font-
                              semibold text-slate-950"
                            >
                              {course.name}
                            </span>
                            <span className="mt-1 block text-sm text-slate-500">
                              {course.academic_year} · {course.semester}
                            </span>
                          </span>
                        </span>

                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-slate-400 transition
                            group-hover:translate-x-0.5 group-hover:text-slate-
                            700"
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  ))}
                </ul>

                <div
                  className="flex flex-col gap-3 border-t border-slate-200
                  bg-slate-50 px-5 py-4 text-sm text-slate-600 sm:flex-row
                  sm:items-center sm:justify-between sm:px-6"
                >
                  <span>
                    Showing {visibleCourses.length} of {activeCourses.length}
                    {""}
                    active offerings
                    {remainingCourseCount > 0
                      ? ` · ${remainingCourseCount} more available`
                      : ""}
                  </span>

                  <button
                    type="button"
                    onClick={() => onNavigateToNavItem("courses")}
                    className="self-start font-semibold text-slate-800
                      underline-offset-4 hover:text-slate-950 hover:underline
                      focus-visible:outline-2 focus-visible:outline-offset-2
                      focus-visible:outline-slate-900 sm:self-auto"
                  >
                    View all course offerings
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        <section
          aria-labelledby="platform-status-heading"
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3
                id="platform-status-heading"
                className="text-lg font-semibold text-slate-950"
              >
                Platform status
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Live application readiness.
              </p>
            </div>

            <Activity
              className="mt-1 h-5 w-5 text-slate-500"
              aria-hidden="true"
            />
          </div>

          {healthQuery.isPending ? (
            <div
              role="status"
              aria-label="Checking platform status"
              className="mt-6 space-y-4"
            >
              <div
                className="h-8 w-32 animate-pulse rounded bg-slate-200"
                aria-hidden="true"
              />
              <div
                className="h-28 animate-pulse rounded-lg bg-slate-100"
                aria-hidden="true"
              />
            </div>
          ) : health ? (
            <>
              <div className="mt-6 flex items-center gap-3">
                <span
                  className={`h-3 w-3 rounded-full ${getToneClass(platformTone)}
                    `}
                  aria-hidden="true"
                />
                <span className="text-xl font-semibold text-slate-950">
                  {platformLabel}
                </span>
              </div>

              <dl
                className="mt-5 divide-y divide-slate-100 border-y border-
                slate-200"
              >
                <StatusRow
                  label="API"
                  value={platformLabel}
                  tone={platformTone}
                />
                <StatusRow
                  label="Database"
                  value={
                    health.status === "down"
                      ? "Unavailable"
                      : health.db_connected
                        ? "Connected"
                        : "Disconnected"
                  }
                  tone={
                    health.status === "down"
                      ? "neutral"
                      : health.db_connected
                        ? "positive"
                        : "negative"
                  }
                />
                <StatusRow
                  label="Schema"
                  value={
                    health.status === "down" || !health.db_connected
                      ? "Unavailable"
                      : health.migrations_current
                        ? "Current"
                        : "Update required"
                  }
                  tone={
                    health.status === "down" || !health.db_connected
                      ? "neutral"
                      : health.migrations_current
                        ? "positive"
                        : "warning"
                  }
                />
              </dl>

              <div
                className="mt-4 flex items-center justify-between gap-4 text-
                xs text-slate-500"
              >
                <span>
                  {healthQuery.dataUpdatedAt > 0
                    ? `Checked ${formatCheckedTime(healthQuery.dataUpdatedAt)}`
                    : "Check completed"}
                </span>
                <span className="font-mono">{health.latency_ms}ms</span>
              </div>
            </>
          ) : (
            <InlineDataError
              title="Platform status is unavailable"
              message="The service health request could not be completed."
              onRetry={() => void healthQuery.refetch()}
            />
          )}
        </section>
      </div>

      <section aria-labelledby="administrative-areas-heading">
        <h3
          id="administrative-areas-heading"
          className="text-lg font-semibold text-slate-950"
        >
          Administrative areas
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Continue directly to a system-management workspace.
        </p>

        <nav
          aria-label="Administrative areas"
          className="mt-4 overflow-hidden rounded-2xl border border-slate-200
            bg-white"
        >
          {ADMIN_AREAS.map((area) => {
            const Icon = area.icon;

            return (
              <button
                key={area.id}
                type="button"
                onClick={() => onNavigateToNavItem(area.id)}
                className="group flex min-h-20 w-full items-center justify-
                  between gap-4 border-b border-slate-100 px-5 py-4 text-left
                  transition last:border-b-0 hover:bg-slate-50 focus-visible:z-10
                  focus-visible:outline-2 focus-visible:-outline-offset-2
                  focus-visible:outline-slate-900 sm:px-6"
              >
                <span className="flex min-w-0 items-center gap-4">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-
  100 text-slate-700 leading-none"
                  >
                    <Icon
                      className="block h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />
                  </span>

                  <span className="min-w-0">
                    <span
                      className="block text-sm font-semibold text-slate-
                      950"
                    >
                      {area.label}
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      {area.description}
                    </span>
                  </span>
                </span>

                <ChevronRight
                  className="h-4 w-4 shrink-0 text-slate-400 transition group-
                    hover:translate-x-0.5 group-hover:text-slate-700"
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </nav>
      </section>
    </div>
  );
}
