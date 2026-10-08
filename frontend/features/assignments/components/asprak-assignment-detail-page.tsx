"use client";

import {
  WarningCircleIcon,
  ArrowLeftIcon,
  ArrowsClockwiseIcon,
  PencilSimpleIcon,
  TrashIcon
} from "@phosphor-icons/react";
import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getCourseDetailRoute, ROUTES } from "@/constants/routes";
import { useAssignedCourses } from "@/features/courses/hooks/use-assigned-courses";
import { ApiError } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format/date";
import {
  useAssignmentDetail,
  useDeleteCourseAssignment
} from "../hooks/use-course-assignments";
import type { Assignment } from "../types/assignment.type";
import { AssignmentEditor } from "./assignment-editor";
import { AssignmentSubmissions } from "./assignment-submissions";

type AssignedAssignmentDetailProps = {
  userId: string;
  courseId: string;
  assignmentId: string;
  onBack?: () => void;
};

function getAllowedFileTypes(value: string) {
  return value
    .split(",")
    .map((fileType) => fileType.trim())
    .filter((fileType) => fileType.length > 0);
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white"
    >
      <AsteriskLoader
        className="h-6 w-6 text-slate-900"
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
  onBack?: () => void;
};

function RequestErrorPanel({
  error,
  fallbackHref,
  fallbackLabel,
  onRetry,
  isRetrying,
  onBack
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
        <WarningCircleIcon
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
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-red-700 px-4 text-sm font-semibold text-white"
            >
              Go to sign in
            </Link>
          ) : retryable ? (
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-red-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowsClockwiseIcon
                className={
                  isRetrying ? "h-4 w-4 animate-spin" : "h-4 w-4"
                }
                aria-hidden="true"
              />
              Try again
            </button>
          ) : onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
              {fallbackLabel}
            </button>
          ) : (
            <Link
              href={fallbackHref}
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-red-700 px-4 text-sm font-semibold text-white"
            >
              {fallbackLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function AssignmentSummary({
  assignment,
  courseCode,
  courseName
}: {
  assignment: Assignment;
  courseCode?: string;
  courseName?: string;
}) {
  const allowedFileTypes = getAllowedFileTypes(
    assignment.allowed_file_types
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {courseCode && (
              <>
                <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400">
                  {courseCode}{courseName ? ` · ${courseName}` : ""}
                </span>
                <span className="text-slate-300" aria-hidden="true">·</span>
              </>
            )}

            <span
              className={`font-semibold ${
                assignment.is_published ? "text-slate-900" : "text-amber-700"
              }`}
            >
              {assignment.is_published ? "Published" : "Draft"}
            </span>

            <span className="text-slate-300" aria-hidden="true">·</span>

            <span
              className={`font-semibold ${
                assignment.grades_published ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              {assignment.grades_published ? "Grades published" : "Grades hidden"}
            </span>

            <span className="text-slate-300" aria-hidden="true">·</span>

            <span className="text-slate-500">
              Created{" "}
              <time dateTime={assignment.created_at}>
                {formatDateTime(assignment.created_at)}
              </time>
            </span>
          </div>

          <h1 className="mt-2.5 wrap-break-word text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            {assignment.title}
          </h1>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          <span className="font-bold text-slate-900 tabular-nums">
            {assignment.submissions_count}
          </span>{" "}
          {assignment.submissions_count === 1 ? "submission" : "submissions"}
        </div>
      </div>

      {assignment.description ? (
        <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-slate-600">
          {assignment.description}
        </p>
      ) : (
        <p className="mt-3 text-xs italic text-slate-400">
          No additional instructions.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Due
          </span>
          <span className="font-semibold text-slate-800">
            {assignment.due_date ? (
              <time dateTime={assignment.due_date}>
                {formatDateTime(assignment.due_date)}
              </time>
            ) : (
              "No deadline"
            )}
          </span>
        </div>

        <span className="text-slate-200 hidden sm:inline" aria-hidden="true">|</span>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Max points
          </span>
          <span className="font-semibold text-slate-800 tabular-nums">
            {assignment.max_points} pts
          </span>
        </div>

        {allowedFileTypes.length > 0 && (
          <>
            <span className="text-slate-200 hidden sm:inline" aria-hidden="true">|</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Formats
              </span>
              <span className="font-semibold uppercase tracking-wide text-slate-700 text-[11px]">
                {allowedFileTypes.join(", ")}
              </span>
            </div>
          </>
        )}

        <span className="text-slate-200 hidden sm:inline" aria-hidden="true">|</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Late submissions
          </span>
          <span
            className={`font-semibold text-[11px] ${
              assignment.allow_late_submissions
                ? "text-slate-700"
                : "text-amber-700"
            }`}
          >
            {assignment.allow_late_submissions ? "Allowed" : "Blocked after deadline"}
          </span>
        </div>
      </div>
    </section>
  );
}

export function AssignedAssignmentDetail({
  userId,
  courseId,
  assignmentId,
  onBack
}: AssignedAssignmentDetailProps) {
  const router = useRouter();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const deleteMutation = useDeleteCourseAssignment({ userId, courseId });
  const courseQuery = useAssignedCourses(userId);
  const course = (courseQuery.data ?? []).find((item) => item.id === courseId);

  function handleDeleteAssignment() {
    deleteMutation.reset();
    deleteMutation.mutate(assignmentId, {
      onSuccess: () => {
        if (onBack) {
          onBack();
        } else {
          router.push(getCourseDetailRoute(courseId, "assignments"));
        }
      }
    });
  }

  const courseVerified =
    !courseQuery.isPending && !courseQuery.isError && Boolean(course);

  const assignmentQuery = useAssignmentDetail({
    userId,
    courseId,
    assignmentId,
    enabled: courseVerified && assignmentId.trim().length > 0
  });

  if (courseQuery.isPending) {
    return <LoadingPanel label="Checking assigned course..." />;
  }

  if (courseQuery.isError) {
    return (
      <RequestErrorPanel
        error={courseQuery.error}
        fallbackHref={ROUTES.dashboard}
        fallbackLabel="Return to dashboard"
        onRetry={() => void courseQuery.refetch()}
        isRetrying={courseQuery.isFetching}
        onBack={onBack}
      />
    );
  }

  if (!course) {
    return (
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
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-amber-900 underline underline-offset-4"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Return to dashboard
          </button>
        ) : (
          <Link
            href={ROUTES.dashboard}
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-amber-900 underline underline-offset-4"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Return to dashboard
          </Link>
        )}
      </div>
    );
  }

  if (assignmentQuery.isPending) {
    return <LoadingPanel label="Loading assignment details..." />;
  }

  if (assignmentQuery.isError) {
    return (
      <RequestErrorPanel
        error={assignmentQuery.error}
        fallbackHref={getCourseDetailRoute(courseId, "assignments")}
        fallbackLabel="Back to Assignments"
        onRetry={() => void assignmentQuery.refetch()}
        isRetrying={assignmentQuery.isFetching}
        onBack={onBack}
      />
    );
  }

  const assignment = assignmentQuery.data;

  if (!assignment || assignment.course_id !== courseId) {
    return (
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
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-amber-900 underline underline-offset-4"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Back to Assignments
          </button>
        ) : (
          <Link
            href={getCourseDetailRoute(courseId, "assignments")}
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-amber-900 underline underline-offset-4"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Back to Assignments
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-full shadow-xs apple-press transition-colors cursor-pointer"
          >
            <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />
            <span>Back to Assignments</span>
          </button>
        ) : (
          <Link
            href={getCourseDetailRoute(courseId, "assignments")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-full shadow-xs apple-press transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />
            <span>Back to Assignments</span>
          </Link>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-full shadow-xs apple-press transition-colors cursor-pointer"
          >
            <PencilSimpleIcon className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>{isEditing ? "Close settings" : "Edit assignment"}</span>
          </button>

          {!isConfirmingDelete ? (
            <button
              type="button"
              onClick={() => {
                deleteMutation.reset();
                setIsConfirmingDelete(true);
              }}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-white border border-rose-200 hover:bg-rose-50 px-3.5 py-2 rounded-full shadow-xs apple-press transition-colors cursor-pointer disabled:opacity-60"
            >
              <TrashIcon className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
              <span>Delete</span>
            </button>
          ) : null}
        </div>
      </div>

      {isConfirmingDelete ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-950">Delete assignment?</p>
          <p className="mt-1 text-xs text-red-800">
            All student submissions and grading records for this assignment will be permanently deleted. This action cannot be undone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              disabled={deleteMutation.isPending}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteAssignment}
              disabled={deleteMutation.isPending}
              className="rounded-full bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
          {deleteMutation.isError ? (
            <p className="mt-3 text-xs text-red-800">
              {deleteMutation.error instanceof ApiError
                ? deleteMutation.error.message
                : "Unable to delete assignment. Please try again."}
            </p>
          ) : null}
        </div>
      ) : null}

      {assignmentQuery.isFetching ? (
        <p role="status" className="text-xs text-slate-500">
          Refreshing assignment...
        </p>
      ) : null}

      <div className="space-y-6">
        <AssignmentSummary
          assignment={assignment}
          courseCode={course.code}
          courseName={course.name}
        />

        {isEditing && (
          <AssignmentEditor
            userId={userId}
            courseId={courseId}
            assignment={assignment}
            isEditing={isEditing}
            onClose={() => setIsEditing(false)}
          />
        )}

        <AssignmentSubmissions
          userId={userId}
          courseId={courseId}
          courseCode={course.code}
          assignment={assignment}
        />
      </div>
    </div>
  );
}
