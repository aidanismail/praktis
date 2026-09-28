"use client";

import {
  Clock3,
  Lock,
  Pencil,
  Radio
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { getSessionDetailRoute } from "@/constants/routes";
import { useUpdateCourseSession } from "../hooks/use-course-sessions";
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
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const updateMutation = useUpdateCourseSession({ userId, courseId });
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
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span
              className={`font-semibold ${
                status === "OPEN"
                  ? "text-emerald-700"
                  : "text-slate-600"
              }`}
            >
              {statusLabels[status]}
            </span>
            <span>·</span>
            <time dateTime={session.date}>{formatSessionDate(session.date)}</time>
          </div>

          <h3 className="mt-1.5 wrap-break-word text-base font-semibold text-slate-950">
            {session.title}
          </h3>
        </div>

        <button
          ref={editButtonRef}
          type="button"
          aria-expanded={isEditing}
          onClick={() => {
            updateMutation.reset();
            setIsEditing((current) => !current);
          }}
          disabled={updateMutation.isPending}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit
        </button>
      </div>

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

      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
        {status === "SCHEDULED" || status === "CLOSED" ? (
          <button
            type="button"
            onClick={() => onTransition(session.id, "open")}
            disabled={transitionPending}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {isThisTransitioning ? (
              <Clock3 className="h-4 w-4 animate-pulse" aria-hidden="true" />
            ) : (
              <Radio className="h-4 w-4" aria-hidden="true" />
            )}
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
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isThisTransitioning ? (
              <Clock3 className="h-4 w-4 animate-pulse" aria-hidden="true" />
            ) : (
              <Lock className="h-4 w-4" aria-hidden="true" />
            )}
            {isThisTransitioning ? "Closing..." : "Close attendance"}
          </button>
        ) : null}

        <Link
          href={getSessionDetailRoute(courseId, session.id)}
          className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
        >
          Open workspace
        </Link>
      </div>
    </article>
  );
}
