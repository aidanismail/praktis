"use client";

import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  FileText,
  Gauge,
  Loader2,
  RefreshCw,
  Users
} from "lucide-react";
import Link from "next/link";
import { getCourseDetailRoute, ROUTES } from "@/constants/routes";
import { useAssignedCourses } from "@/features/courses/hooks/use-assigned-courses";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { useAssignmentDetail } from "../hooks/use-course-assignments";
import type { Assignment } from "../types/assignment.type";
import { AssignmentEditor } from "./assignment-editor";
import { AssignmentSubmissions } from "./assignment-submissions";

type AsprakAssignmentDetailPageProps = {
  courseId: string;
  assignmentId: string;
};

type AssignedAssignmentDetailProps = {
  userId: string;
  courseId: string;
  assignmentId: string;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short"
});

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : dateFormatter.format(date);
}

function getAllowedFileTypes(value: string) {
  return value
    .split(",")
    .map((fileType) => fileType.trim())
    .filter((fileType) => fileType.length > 0);
}

function DetailPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">{children}</div>
    </main>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white"
    >
      <Loader2
        className="h-6 w-6 animate-spin text-slate-900"
        aria-hidden="true"
      />
      <span className="ml-3 text-sm text-slate-600">{label}</span>
    </div>
  );
}

type RequestErrorPanelProps = {
  error: Error;
  fallbackHref: string;
  fallbackLabel: string;
  onRetry: () => void;
  isRetrying: boolean;
};

function RequestErrorPanel({
  error,
  fallbackHref,
  fallbackLabel,
  onRetry,
  isRetrying
}: RequestErrorPanelProps) {
  const status = error instanceof ApiError ? error.status : null;

  let title = "Assignment details could not be loaded";
  let description = "A network or server problem interrupted the request.";

  if (status === 401) {
    title = "Your session has expired";
    description = "Sign in again to continue.";
  } else if (status === 403) {
    title = "Assignment access is unavailable";
    description = "Your account cannot access this course assignment.";
  } else if (status === 404) {
    title = "Assignment not found";
    description = "This assignment does not exist in the selected course.";
  } else if (status === 422) {
    title = "Invalid assignment link";
    description = "The course or assignment identifier is invalid.";
  }

  const retryable =
    status === null || ![401, 403, 404, 422].includes(status);

  return (
    <div
      role="alert"
      className="rounded-3xl border border-red-200 bg-red-50 p-6"
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
          aria-hidden="true"
        />

        <div>
          <h1 className="text-lg font-semibold text-red-950">{title}</h1>

          <p className="mt-2 text-sm leading-6 text-red-800">
            {description}
          </p>

          {status === 401 ? (
            <Link
              href={ROUTES.login}
              className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
            >
              Go to sign in
            </Link>
          ) : retryable ? (
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={
                  isRetrying ? "h-4 w-4 animate-spin" : "h-4 w-4"
                }
                aria-hidden="true"
              />
              Try again
            </button>
          ) : (
            <Link
              href={fallbackHref}
              className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
            >
              {fallbackLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function AssignmentSummary({ assignment }: { assignment: Assignment }) {
  const allowedFileTypes = getAllowedFileTypes(
    assignment.allowed_file_types
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                assignment.is_published
                  ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                  : "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"
              }
            >
              {assignment.is_published ? "Published" : "Draft"}
            </span>

            <span className="text-xs text-slate-500">
              Created{" "}
              <time dateTime={assignment.created_at}>
                {formatDate(assignment.created_at)}
              </time>
            </span>
          </div>

          <h1 className="mt-3 wrap-break-word text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {assignment.title}
          </h1>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
          <Users className="h-4 w-4" aria-hidden="true" />
          {assignment.submissions_count}{" "}
          {assignment.submissions_count === 1 ? "submission" : "submissions"}
        </div>
      </div>

      {assignment.description ? (
        <p className="mt-5 whitespace-pre-wrap wrap-break-word text-sm leading-7 text-slate-700">
          {assignment.description}
        </p>
      ) : (
        <p className="mt-5 text-sm italic text-slate-500">
          No additional instructions.
        </p>
      )}

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            Due
          </dt>
          <dd className="mt-2 text-sm font-medium text-slate-900">
            {assignment.due_date ? (
              <time dateTime={assignment.due_date}>
                {formatDate(assignment.due_date)}
              </time>
            ) : (
              "No deadline"
            )}
          </dd>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Gauge className="h-4 w-4" aria-hidden="true" />
            Points
          </dt>
          <dd className="mt-2 text-sm font-medium text-slate-900">
            {assignment.max_points} maximum
          </dd>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <FileText className="h-4 w-4" aria-hidden="true" />
            Formats
          </dt>
          <dd className="mt-2 flex flex-wrap gap-1.5">
            {allowedFileTypes.length > 0 ? (
              allowedFileTypes.map((fileType) => (
                <span
                  key={fileType}
                  className="rounded-lg bg-white px-2 py-1 text-xs font-semibold uppercase text-slate-700"
                >
                  {fileType}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-600">None listed</span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function AssignedAssignmentDetail({
  userId,
  courseId,
  assignmentId
}: AssignedAssignmentDetailProps) {
  const courseQuery = useAssignedCourses(userId);
  const course = (courseQuery.data ?? []).find((item) => item.id === courseId);

  const courseVerified =
    !courseQuery.isPending && !courseQuery.isError && Boolean(course);

  const assignmentQuery = useAssignmentDetail({
    userId,
    courseId,
    assignmentId,
    enabled: courseVerified && assignmentId.trim().length > 0
  });

  if (courseQuery.isPending) {
    return (
      <DetailPageFrame>
        <LoadingPanel label="Checking assigned course..." />
      </DetailPageFrame>
    );
  }

  if (courseQuery.isError) {
    return (
      <DetailPageFrame>
        <RequestErrorPanel
          error={courseQuery.error}
          fallbackHref={ROUTES.dashboard}
          fallbackLabel="Return to dashboard"
          onRetry={() => void courseQuery.refetch()}
          isRetrying={courseQuery.isFetching}
        />
      </DetailPageFrame>
    );
  }

  if (!course) {
    return (
      <DetailPageFrame>
        <div
          role="alert"
          className="rounded-3xl border border-amber-200 bg-amber-50 p-6"
        >
          <h1 className="text-lg font-semibold text-amber-950">
            Course is unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            This course does not exist in your assigned practicum classes.
          </p>
          <Link
            href={ROUTES.dashboard}
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-amber-900 underline underline-offset-4"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Return to dashboard
          </Link>
        </div>
      </DetailPageFrame>
    );
  }

  if (assignmentQuery.isPending) {
    return (
      <DetailPageFrame>
        <LoadingPanel label="Loading assignment details..." />
      </DetailPageFrame>
    );
  }

  if (assignmentQuery.isError) {
    return (
      <DetailPageFrame>
        <RequestErrorPanel
          error={assignmentQuery.error}
          fallbackHref={getCourseDetailRoute(courseId, "assignments")}
          fallbackLabel="Back to Assignments"
          onRetry={() => void assignmentQuery.refetch()}
          isRetrying={assignmentQuery.isFetching}
        />
      </DetailPageFrame>
    );
  }

  const assignment = assignmentQuery.data;

  if (!assignment || assignment.course_id !== courseId) {
    return (
      <DetailPageFrame>
        <div
          role="alert"
          className="rounded-3xl border border-amber-200 bg-amber-50 p-6"
        >
          <h1 className="text-lg font-semibold text-amber-950">
            Assignment is unavailable
          </h1>
          <p className="mt-2 text-sm text-amber-800">
            The assignment does not belong to the selected course.
          </p>
          <Link
            href={getCourseDetailRoute(courseId, "assignments")}
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-amber-900 underline underline-offset-4"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Assignments
          </Link>
        </div>
      </DetailPageFrame>
    );
  }

  return (
    <DetailPageFrame>
      <Link
        href={getCourseDetailRoute(courseId, "assignments")}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Assignments
      </Link>

      <p className="mt-5 text-sm font-medium text-emerald-700">
        {course.code} · {course.name}
      </p>

      {assignmentQuery.isFetching ? (
        <p role="status" className="mt-2 text-sm text-slate-500">
          Refreshing assignment...
        </p>
      ) : null}

      <div className="mt-4 space-y-6">
        <AssignmentSummary assignment={assignment} />

        <AssignmentEditor
          userId={userId}
          courseId={courseId}
          assignment={assignment}
        />

        <AssignmentSubmissions
          userId={userId}
          courseId={courseId}
          assignmentId={assignment.id}
          maxPoints={assignment.max_points}
          enabled={assignment.course_id === courseId}
        />
      </div>
    </DetailPageFrame>
  );
}

export function AsprakAssignmentDetailPage({
  courseId,
  assignmentId
}: AsprakAssignmentDetailPageProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  if (user.role !== "asprak") {
    return (
      <DetailPageFrame>
        <div
          role="alert"
          className="rounded-3xl border border-amber-200 bg-amber-50 p-6"
        >
          <h1 className="text-lg font-semibold text-amber-950">
            Asprak access required
          </h1>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Assignment management is available only to Asprak accounts.
          </p>
          <Link
            href={ROUTES.dashboard}
            className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-amber-900 underline underline-offset-4"
          >
            Return to dashboard
          </Link>
        </div>
      </DetailPageFrame>
    );
  }

  return (
    <AssignedAssignmentDetail
      userId={user.id}
      courseId={courseId}
      assignmentId={assignmentId}
    />
  );
}
