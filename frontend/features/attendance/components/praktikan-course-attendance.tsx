"use client";

import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { useCourseSessions } from "@/features/sessions/hooks/use-course-sessions";
import { getSessionAttendanceStatus } from "@/features/sessions/types/session.type";
import { usePersonalAttendance } from "../hooks/use-personal-attendance";
import type { AttendanceStatus } from "../types/attendance.type";
import {
  CalendarDots,
  ArrowsClockwise
} from "@phosphor-icons/react";

type Props = { userId: string; courseId: string };

const labels: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  alfa: "Alfa",
};

const statusTextColors: Record<AttendanceStatus, string> = {
  hadir: "text-emerald-700 font-semibold",
  sakit: "text-sky-700 font-semibold",
  izin: "text-amber-700 font-semibold",
  alfa: "text-rose-700 font-semibold",
};

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "full" });

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : dateFormatter.format(date);
}

export function PraktikanCourseAttendance({ userId, courseId }: Props) {
  const sessionsQuery = useCourseSessions({ userId, courseId, enabled: true });
  const attendanceQuery = usePersonalAttendance(userId);

  if (sessionsQuery.isPending || attendanceQuery.isPending) {
    return (
      <div
        role="status"
        className="flex min-h-56 items-center justify-center rounded-3xl border border-slate-200 bg-white"
      >
        <AsteriskLoader className="h-5 w-5 text-slate-400" aria-hidden="true" />
        <span className="ml-3 text-xs font-medium text-slate-600">Loading sessions and attendance...</span>
      </div>
    );
  }

  if (sessionsQuery.isError || attendanceQuery.isError) {
    return (
      <NotificationBanner variant="error">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div>
            <h3 className="font-semibold text-white">Couldn&apos;t load sessions or attendance</h3>
            <p className="mt-0.5 text-xs text-slate-300">
              Something went wrong while fetching the schedule. Let&apos;s give it another shot.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void sessionsQuery.refetch();
              void attendanceQuery.refetch();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition disabled:opacity-60 shrink-0"
          >
            <ArrowsClockwise className="h-3.5 w-3.5" aria-hidden="true" />
            Try again
          </button>
        </div>
      </NotificationBanner>
    );
  }

  const attendance = new Map(
    (attendanceQuery.data ?? [])
      .filter((row) => row.course_id === courseId)
      .map((row) => [row.session_id, row])
  );
  const sessions = [...(sessionsQuery.data ?? [])].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section aria-labelledby="praktikan-sessions-heading" className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Schedule &amp; Records</p>
        <h2 id="praktikan-sessions-heading" className="mt-1 text-xl font-bold tracking-tight text-slate-950">
          Sessions &amp; Attendance
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Track your class schedule and personal attendance records for each session.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div
          role="status"
          className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-xs"
        >
          <CalendarDots className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
          <h3 className="mt-3 text-sm font-bold text-slate-950">No sessions scheduled yet</h3>
          <p className="mt-1 text-xs text-slate-500">
            Upcoming lab sessions and attendance windows will show up here once created.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sessions.map((session) => {
            const record = attendance.get(session.id);
            const windowState = getSessionAttendanceStatus(session.attendance_status);

            return (
              <article
                key={session.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs apple-card-hover transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-950 tracking-tight">{session.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      <time dateTime={session.date}>{formatDate(session.date)}</time>
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Window: <span className="font-semibold text-slate-800 capitalize">{windowState === "UNKNOWN" ? "Unavailable" : windowState.toLowerCase()}</span>
                  </span>
                </div>

                <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider">
                    My attendance
                  </span>
                  {record ? (
                    <span className={statusTextColors[record.status]}>
                      {labels[record.status]}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium">
                      Not recorded yet
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
