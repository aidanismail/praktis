"use client";

import {
  ArrowRight,
  CalendarDays,
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
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
          >
            {statusLabels[status]}
          </span>
          <h3 className="mt-3 wrap-break-word text-lg font-semibold text-slate-950">
            {session.title}
          </h3>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <time dateTime={session.date}>{formatSessionDate(session.date)}</time>
          </p>
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
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
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
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
        >
          Open workspace
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
