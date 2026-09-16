"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { getSessionDetailRoute } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import {
  useDeleteCourseSession,
  useUpdateCourseSession
} from "../hooks/use-course-sessions";
import type { SessionFormValues } from "../schemas/session.schema";
import {
  getSessionAttendanceStatus,
  type CourseSession
} from "../types/session.type";
import { SessionForm } from "./session-form";

type SessionCardProps = {
  userId: string;
  courseId: string;
  session: CourseSession;
  transitionPending: boolean;
  transitioningSessionId: string | null;
  onTransition: (sessionId: string, action: "open" | "close") => void;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
  timeZone: "UTC"
});

function formatSessionDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : dateFormatter.format(date);
}

const statusStyles = {
  SCHEDULED: "bg-sky-50 text-sky-800",
  OPEN: "bg-emerald-50 text-emerald-800",
  CLOSED: "bg-slate-100 text-slate-700",
  UNKNOWN: "bg-amber-50 text-amber-900"
} as const;

const statusLabels = {
  SCHEDULED: "Scheduled",
  OPEN: "Attendance open",
  CLOSED: "Attendance closed",
  UNKNOWN: "Unknown state"
} as const;

export function SessionCard({
  userId,
  courseId,
  session,
  transitionPending,
  transitioningSessionId,
  onTransition
}: SessionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const updateMutation = useUpdateCourseSession({ userId, courseId });
  const deleteMutation = useDeleteCourseSession({ userId, courseId });
  const status = getSessionAttendanceStatus(session.attendance_status);
  const isThisTransitioning =
    transitionPending && transitioningSessionId === session.id;

  function returnFocusToEdit() {
    requestAnimationFrame(() => editButtonRef.current?.focus());
  }

  async function updateSession(values: SessionFormValues) {
    updateMutation.reset();

    try {
      await updateMutation.mutateAsync({
        sessionId: session.id,
        payload: values
      });
      setIsEditing(false);
      returnFocusToEdit();
      return true;
    } catch {
      return false;
    }
  }

  function cancelEditing() {
    updateMutation.reset();
    setIsEditing(false);
    returnFocusToEdit();
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status]}`}
          >
            {statusLabels[status]}
          </span>
          <h3 className="mt-2.5 wrap-break-word text-base font-bold text-slate-950">
            {session.title}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            <time dateTime={session.date}>{formatSessionDate(session.date)}</time>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            ref={editButtonRef}
            type="button"
            aria-expanded={isEditing}
            onClick={() => {
              updateMutation.reset();
              setIsEditing((current) => !current);
            }}
            disabled={updateMutation.isPending || deleteMutation.isPending}
            className="inline-flex min-h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Edit
          </button>

          {!isConfirmingDelete ? (
            <button
              type="button"
              onClick={() => {
                deleteMutation.reset();
                setIsConfirmingDelete(true);
              }}
              disabled={updateMutation.isPending || deleteMutation.isPending}
              className="inline-flex min-h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>

      {isConfirmingDelete ? (
        <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-950">Delete session?</p>
          <p className="mt-1 text-sm text-red-800">
            Attendance records and assignments linked to this session will also be deleted. This action cannot be undone.
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
              onClick={() => deleteMutation.mutate(session.id)}
              disabled={deleteMutation.isPending}
              className="rounded-xl bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
          {deleteMutation.isError ? (
            <p className="mt-3 text-sm text-red-800">
              {deleteMutation.error instanceof ApiError && deleteMutation.error.status === 400
                ? deleteMutation.error.message || "Cannot delete session with published grades. Unpublish grades first."
                : deleteMutation.error.message || "Unable to delete session. Please try again."}
            </p>
          ) : null}
        </div>
      ) : null}

      {status === "UNKNOWN" ? (
        <p role="alert" className="mt-4 text-sm text-amber-800">
          The backend returned an unsupported attendance state. Refresh before
          changing this session.
        </p>
      ) : null}

      {isEditing ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="mb-4 font-semibold text-slate-950">
            Edit session details
          </h4>
          <SessionForm
            defaultValues={{ title: session.title, date: session.date }}
            submitLabel="Save changes"
            pendingLabel="Saving..."
            isPending={updateMutation.isPending}
            error={updateMutation.error}
            onSubmit={updateSession}
            onCancel={cancelEditing}
            autoFocusTitle
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {status === "SCHEDULED" || status === "CLOSED" ? (
          <button
            type="button"
            onClick={() => onTransition(session.id, "open")}
            disabled={transitionPending}
            className="inline-flex min-h-9 items-center rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isThisTransitioning
              ? status === "CLOSED"
                ? "Reopening..."
                : "Opening..."
              : status === "CLOSED"
                ? "Reopen attendance"
                : "Open attendance"}
          </button>
        ) : null}

        {status === "OPEN" ? (
          <button
            type="button"
            onClick={() => onTransition(session.id, "close")}
            disabled={transitionPending}
            className="inline-flex min-h-9 items-center rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isThisTransitioning ? "Closing..." : "Close attendance"}
          </button>
        ) : null}

        <Link
          href={getSessionDetailRoute(courseId, session.id)}
          className="inline-flex min-h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
        >
          Open workspace
        </Link>
      </div>
    </article>
  );
}
