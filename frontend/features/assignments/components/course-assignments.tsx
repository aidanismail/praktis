"use client";

import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useCourseAssignments } from "../hooks/use-course-assignments";
import { AssignmentCard } from "./assignment-card";
import { AssignmentComposer } from "./assignment-composer";
import {
  WarningCircle,
  Clipboard,
  ArrowsClockwise
} from "@phosphor-icons/react";

type CourseAssignmentsProps = {
  courseId: string;
  userId: string;
  viewerRole: "asprak" | "praktikan";
  onSelectAssignment?: (id: string) => void;
};

export function CourseAssignments({
  userId,
  courseId,
  viewerRole,
  onSelectAssignment
}: CourseAssignmentsProps) {
  const {
    data: assignments = [],
    error,
    isError,
    isFetching,
    isPending,
    refetch
  } = useCourseAssignments({
    userId,
    courseId,
    enabled: true
  });

  const isUnauthorized = error instanceof ApiError && error.status === 401;
  const isForbidden = error instanceof ApiError && error.status === 403;
  const isNotFound = error instanceof ApiError && error.status === 404;

  if (isPending) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white"
      >
        <AsteriskLoader
          className="h-5 w-5 text-slate-900"
          aria-hidden="true"
        />
        <span className="ml-3 text-xs font-medium text-slate-600">
          Loading assignments...
        </span>
      </div>
    );
  }

  if (isError) {
    let title = "Unable to load assignments";
    let description = "Unable to connect to the server. Please try again.";

    if (isUnauthorized) {
      title = "Your session has expired";
      description = "Please sign in again to continue.";
    } else if (isForbidden) {
      title = "Access restricted";
      description =
        "You don't have permission to access assignments in this course.";
    } else if (isNotFound) {
      title = "Course not found";
      description = "This course may no longer be available.";
    }

    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 p-6"
      >
        <div className="flex items-start gap-3">
          <WarningCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
            aria-hidden="true"
          />

          <div>
            <h2 className="font-semibold text-red-950">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-red-800">{description}</p>

            {isUnauthorized ? (
              <Link
                href={ROUTES.login}
                className="mt-4 inline-flex rounded-full bg-red-700 px-4 py-2 text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
              >
                Go to sign in
              </Link>
            ) : null}

            {isForbidden || isNotFound ? (
              <Link
                href={ROUTES.dashboard}
                className="mt-4 inline-flex text-xs font-semibold text-red-900 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
              >
                Return to dashboard
              </Link>
            ) : null}

            {!isUnauthorized && !isForbidden && !isNotFound ? (
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-red-700 px-4 py-2 text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowsClockwise
                  className={isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"}
                  aria-hidden="true"
                />
                {isFetching ? "Retrying..." : "Try again"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // 2-column layout for Asprak (List left, Create right); clean single-column for Praktikan
  if (viewerRole === "asprak") {
    return (
      <div aria-busy={isFetching}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Assessment list */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-baseline justify-between border-b border-slate-200/80 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-950">
                  Assignments
                  <span className="ml-2 text-xs font-normal text-slate-500 tabular-nums">
                    ({assignments.length})
                  </span>
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Manage prompts, deadlines, and submissions.
                </p>
              </div>

              {isFetching ? (
                <span role="status" className="text-xs text-slate-400 font-medium">
                  Updating...
                </span>
              ) : null}
            </div>

            {assignments.length === 0 ? (
              <div
                role="status"
                className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-center"
              >
                <Clipboard
                  className="mx-auto h-7 w-7 text-slate-300"
                  aria-hidden="true"
                />
                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  No assignments yet
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Use the create panel on the right to draft your first assignment.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    viewerRole={viewerRole}
                    userId={userId}
                    onSelectAssignment={onSelectAssignment}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Create assignment panel (sticky) */}
          <div className="lg:col-span-5 lg:sticky lg:top-4">
            <AssignmentComposer userId={userId} courseId={courseId} />
          </div>
        </div>
      </div>
    );
  }

  // Praktikan layout
  return (
    <div aria-busy={isFetching} className="max-w-3xl space-y-4">
      <div className="flex items-baseline justify-between border-b border-slate-200/80 pb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-950">
            Assignments
            <span className="ml-2 text-xs font-normal text-slate-500 tabular-nums">
              ({assignments.length})
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Track upcoming tasks, instructions, and your submission progress.
          </p>
        </div>

        {isFetching ? (
          <span role="status" className="text-xs text-slate-400 font-medium">
            Updating...
          </span>
        ) : null}
      </div>

      {assignments.length === 0 ? (
        <div
          role="status"
          className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-center"
        >
          <Clipboard
            className="mx-auto h-7 w-7 text-slate-300"
            aria-hidden="true"
          />
          <h3 className="mt-2 text-sm font-semibold text-slate-900">
            No assignments posted yet
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            No assignments have been published for this course yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              viewerRole={viewerRole}
              userId={userId}
              onSelectAssignment={onSelectAssignment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
