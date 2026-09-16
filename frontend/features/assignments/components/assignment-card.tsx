"use client";

import Link from "next/link";
import { useState } from "react";
import { getAssignmentDetailRoute } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { useDeleteCourseAssignment } from "../hooks/use-course-assignments";
import type { Assignment } from "../types/assignment.type";

type AssignmentCardProps = {
  assignment: Assignment;
  viewerRole: "asprak" | "praktikan";
  userId?: string;
};

const assignmentDateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short"
});

function formatAssignmentDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : assignmentDateFormatter.format(date);
}

function getAllowedFileTypes(value: string) {
  return value
    .split(",")
    .map((fileType) => fileType.trim())
    .filter((fileType) => fileType.length > 0);
}

export function AssignmentCard({
  assignment,
  viewerRole,
  userId
}: AssignmentCardProps) {
  const storeUserId = useAuthStore((state) => state.user?.id);
  const activeUserId = userId ?? storeUserId ?? "";
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const deleteMutation = useDeleteCourseAssignment({
    userId: activeUserId,
    courseId: assignment.course_id
  });

  const allowedFileTypes = getAllowedFileTypes(assignment.allowed_file_types);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                assignment.is_published
                  ? "rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
                  : "rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
              }
            >
              {assignment.is_published ? "Published" : "Draft"}
            </span>

            <span className="text-xs text-slate-500">
              Created{" "}
              <time dateTime={assignment.created_at}>
                {formatAssignmentDate(assignment.created_at)}
              </time>
            </span>
          </div>

          <h3 className="mt-2.5 wrap-break-word text-base font-bold text-slate-950">
            {assignment.title}
          </h3>
        </div>

        {viewerRole === "asprak" ? (
          <div className="rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
            {assignment.submissions_count}{" "}
            {assignment.submissions_count === 1 ? "submission" : "submissions"}
          </div>
        ) : (
          <span
            className={
              assignment.my_submission
                ? "rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800"
                : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
            }
          >
            {assignment.my_submission
              ? assignment.my_submission.score === null
                ? "Submitted · Awaiting grade"
                : "Submitted · Graded"
              : "No recorded submission"}
          </span>
        )}
      </div>

      {assignment.description ? (
        <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-600">
          {assignment.description}
        </p>
      ) : (
        <p className="mt-3 text-xs italic text-slate-400">
          No additional instructions.
        </p>
      )}

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3.5">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Due
          </dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">
            {assignment.due_date ? (
              <time dateTime={assignment.due_date}>
                {formatAssignmentDate(assignment.due_date)}
              </time>
            ) : (
              "No deadline"
            )}
          </dd>
        </div>

        <div className="rounded-xl bg-slate-50 p-3.5">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Points
          </dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">
            {assignment.max_points} maximum
          </dd>
        </div>

        <div className="rounded-xl bg-slate-50 p-3.5">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Allowed formats
          </dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {allowedFileTypes.length > 0 ? (
              allowedFileTypes.map((fileType) => (
                <span
                  key={fileType}
                  className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold uppercase text-slate-700 border border-slate-200"
                >
                  {fileType}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">None listed</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <Link
          href={getAssignmentDetailRoute(
            assignment.course_id,
            assignment.id
          )}
          className="inline-flex min-h-9 items-center rounded-lg text-sm font-semibold text-emerald-700 underline-offset-4 transition hover:text-emerald-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          Open assignment
        </Link>

        {viewerRole === "asprak" && activeUserId && !isConfirmingDelete ? (
          <button
            type="button"
            onClick={() => {
              deleteMutation.reset();
              setIsConfirmingDelete(true);
            }}
            disabled={deleteMutation.isPending}
            className="inline-flex min-h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-60"
          >
            Delete
          </button>
        ) : null}
      </div>

      {isConfirmingDelete ? (
        <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-950">Delete assignment?</p>
          <p className="mt-1 text-sm text-red-800">
            All student submissions and grading records for this assignment will be permanently deleted. This action cannot be undone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              disabled={deleteMutation.isPending}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(assignment.id)}
              disabled={deleteMutation.isPending}
              className="rounded-xl bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
          {deleteMutation.isError ? (
            <p className="mt-3 text-sm text-red-800">
              {deleteMutation.error instanceof ApiError
                ? deleteMutation.error.message
                : "Unable to delete assignment. Please try again."}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
