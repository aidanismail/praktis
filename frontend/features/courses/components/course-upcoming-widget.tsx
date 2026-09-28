"use client";

import { useMemo } from "react";
import {
  Clock,
  CalendarCheck,
  CheckCircle,
  CaretRight,
} from "@phosphor-icons/react";
import { useCourseAssignments } from "@/features/assignments/hooks/use-course-assignments";
import { useCourseSessions } from "@/features/sessions/hooks/use-course-sessions";
import type { Assignment } from "@/features/assignments/types/assignment.type";
import type { CourseSession } from "@/features/sessions/types/session.type";
import { AsteriskLoader } from "@/components/ui/asterisk-loader";

type CourseUpcomingWidgetProps = {
  userId: string;
  courseId: string;
  viewerRole: "praktikan" | "asprak";
  onNavigateToAssignments: () => void;
  onSelectAssignment: (assignmentId: string) => void;
  onNavigateToSessions: () => void;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

function formatDueDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return dateFormatter.format(date);
}

function formatSessionDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return dateFormatter.format(date);
}

export function CourseUpcomingWidget({
  userId,
  courseId,
  viewerRole,
  onNavigateToAssignments,
  onSelectAssignment,
  onNavigateToSessions,
}: CourseUpcomingWidgetProps) {
  const assignmentsQuery = useCourseAssignments({
    userId,
    courseId,
    enabled: true,
  });

  const sessionsQuery = useCourseSessions({
    userId,
    courseId,
    enabled: true,
  });

  const isLoading = assignmentsQuery.isPending || sessionsQuery.isPending;
  const referenceTime = assignmentsQuery.dataUpdatedAt || sessionsQuery.dataUpdatedAt || 0;

  // Upcoming assignments: published, has due_date, sorted by due_date ascending
  const upcomingAssignments = useMemo(() => {
    const list = (assignmentsQuery.data ?? []).filter(
      (a: Assignment) => a.is_published && a.due_date
    );
    return list
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 4)
      .map((a) => ({
        ...a,
        isPastDue: Boolean(
          referenceTime > 0 &&
            a.due_date &&
            new Date(a.due_date).getTime() < referenceTime
        ),
      }));
  }, [assignmentsQuery.data, referenceTime]);

  // Next upcoming session
  const nextSession = useMemo(() => {
    const sessions = (sessionsQuery.data ?? []) as CourseSession[];
    if (sessions.length === 0) return null;

    const todayStr = referenceTime > 0
      ? new Date(referenceTime).toISOString().split("T")[0]
      : "";

    // Check if any session is currently OPEN
    const openSession = sessions.find(
      (s) => s.attendance_status === "OPEN"
    );
    if (openSession) return openSession;

    // Next future session
    const futureSessions = sessions
      .filter((s) => !todayStr || s.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (futureSessions.length > 0) return futureSessions[0];

    // Fall back to most recent session
    return [...sessions].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [sessionsQuery.data, referenceTime]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-center min-h-[140px]">
          <AsteriskLoader className="h-5 w-5 text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upcoming Assignments Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-slate-700" weight="bold" />
            <span>Upcoming</span>
          </h3>

          <button
            type="button"
            onClick={onNavigateToAssignments}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 hover:underline transition-colors cursor-pointer"
          >
            View all
          </button>
        </div>

        {upcomingAssignments.length === 0 ? (
          <div className="py-3 text-center">
            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto" weight="fill" />
            <p className="mt-1.5 text-xs font-medium text-slate-600">
              No assignments due soon
            </p>
            <p className="text-[11px] text-slate-400">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-1.5 pt-1">
            {upcomingAssignments.map((assignment) => {
              const hasSubmitted = Boolean(assignment.my_submission);
              const isPastDue = assignment.isPastDue;

              return (
                <div
                  key={assignment.id}
                  onClick={() => onSelectAssignment(assignment.id)}
                  className="group -mx-2 p-2.5 rounded-2xl hover:bg-slate-50/80 border border-transparent hover:border-slate-100 transition-all cursor-pointer apple-press"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectAssignment(assignment.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs text-slate-800 line-clamp-1 group-hover:text-slate-950 transition-colors">
                      {assignment.title}
                    </span>
                    <CaretRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-400 font-medium">
                      Due {formatDueDate(assignment.due_date!)}
                    </span>

                    {viewerRole === "praktikan" ? (
                      hasSubmitted ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                          Turned in
                        </span>
                      ) : isPastDue ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[10px]">
                          Missing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">
                          Assigned
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400 text-[10px]">
                        {assignment.submissions_count} turned in
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Next Session Card */}
      <div
        onClick={onNavigateToSessions}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 cursor-pointer apple-card-hover transition-all group"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onNavigateToSessions();
          }
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
            <CalendarCheck className="w-4 h-4 text-slate-700" weight="bold" />
            <span>Next Session</span>
          </h3>

          <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-900 group-hover:underline transition-colors">
            View
          </span>
        </div>

        {nextSession ? (
          <div className="pt-1 space-y-2">
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-slate-950 transition-colors line-clamp-1">
                {nextSession.title}
              </h4>
              <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
                {formatSessionDate(nextSession.date)}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-medium">
                Attendance
              </span>

              {nextSession.attendance_status === "OPEN" ? (
                <span className="inline-flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Open Now
                </span>
              ) : nextSession.attendance_status === "CLOSED" ? (
                <span className="inline-flex items-center font-medium text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Closed
                </span>
              ) : (
                <span className="inline-flex items-center font-medium text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  Scheduled
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="py-2 text-center">
            <p className="text-xs text-slate-400">No scheduled sessions</p>
          </div>
        )}
      </div>
    </div>
  );
}
