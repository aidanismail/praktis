"use client";

import { CaretRight } from "@phosphor-icons/react";
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
  onSelectAssignment?: (id: string) => void;
};

const assignmentDateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
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
  userId,
  onSelectAssignment,
}: AssignmentCardProps) {
  const storeUserId = useAuthStore((state) => state.user?.id);
  const activeUserId = userId ?? storeUserId ?? "";
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const deleteMutation = useDeleteCourseAssignment({
    userId: activeUserId,
    courseId: assignment.course_id,
  });

  const allowedFileTypes = getAllowedFileTypes(assignment.allowed_file_types);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
      {/* Top Header: Typographic Status & Submissions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`font-semibold ${
              assignment.is_published ? "text-slate-900" : "text-amber-700"
            }`}
          >
            {assignment.is_published ? "Published" : "Draft"}
          </span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <time dateTime={assignment.created_at} className="text-slate-400 text-[11px]">
            {formatAssignmentDate(assignment.created_at)}
          </time>
        </div>

        {viewerRole === "asprak" ? (
          <span className="text-xs text-slate-500 font-medium">
            <span className="font-semibold text-slate-900 tabular-nums">
              {assignment.submissions_count}
            </span>{" "}
            {assignment.submissions_count === 1 ? "submission" : "submissions"}
          </span>
        ) : (
          <span
            className={`text-xs font-semibold ${
              assignment.my_submission
                ? assignment.my_submission.score === null
                  ? "text-amber-700"
                  : "text-emerald-700"
                : "text-slate-400 font-medium"
            }`}
          >
            {assignment.my_submission
              ? assignment.my_submission.score === null
                ? "Submitted · Awaiting grade"
                : "Submitted · Graded"
              : "Not submitted"}
          </span>
        )}
      </div>

      {/* Assignment Title */}
      <h3 className="mt-2 text-sm sm:text-base font-bold text-slate-950 tracking-tight">
        {assignment.title}
      </h3>

      {/* Description */}
      {assignment.description && (
        <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {assignment.description}
        </p>
      )}

      {/* Compact Typographic Metadata Strip (no bulky pill bubbles) */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1 pt-2.5 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Due
          </span>
          <span className="font-medium text-slate-800">
            {assignment.due_date ? (
              <time dateTime={assignment.due_date}>
                {formatAssignmentDate(assignment.due_date)}
              </time>
            ) : (
              "No deadline"
            )}
          </span>
        </div>

        {viewerRole === "asprak" && (
          <>
            <span className="text-slate-200 hidden sm:inline" aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Max
              </span>
              <span className="font-medium text-slate-800 tabular-nums">
                {assignment.max_points} pts
              </span>
            </div>
          </>
        )}

        {allowedFileTypes.length > 0 && (
          <>
            <span className="text-slate-200 hidden sm:inline" aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Formats
              </span>
              <span className="font-medium text-slate-700 uppercase tracking-wide text-[11px]">
                {allowedFileTypes.join(", ")}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-3 flex items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
        {onSelectAssignment ? (
          <button
            type="button"
            onClick={() => onSelectAssignment(assignment.id)}
            className="apple-press inline-flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-slate-950 transition-colors"
          >
            <span>Open assignment</span>
            <CaretRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        ) : (
          <Link
            href={getAssignmentDetailRoute(
              assignment.course_id,
              assignment.id
            )}
            className="apple-press inline-flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-slate-950 transition-colors"
          >
            <span>Open assignment</span>
            <CaretRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        )}

        {viewerRole === "asprak" && activeUserId && !isConfirmingDelete ? (
          <button
            type="button"
            onClick={() => {
              deleteMutation.reset();
              setIsConfirmingDelete(true);
            }}
            disabled={deleteMutation.isPending}
            className="text-xs font-medium text-slate-400 hover:text-red-600 transition-colors"
          >
            Delete
          </button>
        ) : null}
      </div>

      {isConfirmingDelete ? (
        <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3.5">
          <p className="text-xs font-semibold text-red-950">Delete this assignment?</p>
          <p className="mt-0.5 text-xs text-red-800">
            Student submissions and grades will be permanently deleted.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              disabled={deleteMutation.isPending}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(assignment.id)}
              disabled={deleteMutation.isPending}
              className="rounded-full bg-red-700 px-3 py-1 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
          {deleteMutation.isError ? (
            <p className="mt-2 text-xs text-red-800">
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
