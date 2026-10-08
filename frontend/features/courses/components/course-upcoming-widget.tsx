"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClockIcon,
  CalendarCheckIcon,
  CheckCircleIcon,
  CaretRightIcon,
  GraduationCapIcon,
} from "@phosphor-icons/react";
import { useCourseAssignments } from "@/features/assignments/hooks/use-course-assignments";
import { useCourseSessions } from "@/features/sessions/hooks/use-course-sessions";
import { usePersonalGrades } from "@/features/grades/hooks/use-personal-grades";
import type { Assignment } from "@/features/assignments/types/assignment.type";
import type { CourseSession } from "@/features/sessions/types/session.type";
import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import { SessionStatusBadge } from "@/features/sessions/components/session-status-badge";
import { formatCalendarDate, formatDate, localDateKey } from "@/lib/format/date";
import { formatScore } from "@/lib/format/score";

type CourseUpcomingWidgetProps = {
  userId: string;
  courseId: string;
  viewerRole: "praktikan" | "asprak";
  onNavigateToAssignments: () => void;
  onSelectAssignment: (assignmentId: string) => void;
  onNavigateToSessions: () => void;
  onNavigateToGrades?: () => void;
};

const CLOCK_TICK_MS = 60_000;
const MAX_UPCOMING = 4;
const MAX_PAST = 2;

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="py-3 text-center">
      <p className="text-xs font-medium text-rose-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
      >
        Retry
      </button>
    </div>
  );
}

export function CourseUpcomingWidget({
  userId,
  courseId,
  viewerRole,
  onNavigateToAssignments,
  onSelectAssignment,
  onNavigateToSessions,
  onNavigateToGrades,
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

  const gradesQuery = usePersonalGrades(userId, viewerRole === "praktikan");

  const recentGrades = useMemo(() => {
    if (viewerRole !== "praktikan") return [];
    return (gradesQuery.data ?? [])
      .filter((g) => g.course_id === courseId && g.item_type === "assignment")
      .slice(0, 3);
  }, [gradesQuery.data, viewerRole, courseId]);

  const isLoading = assignmentsQuery.isPending || sessionsQuery.isPending;

  // Coarse clock so "past due" and "today" stay correct without re-rendering constantly.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Published assignments with a deadline: upcoming first (soonest first), then a few
  // recent past ones (students only see past ones they have not turned in).
  const upcomingAssignments = useMemo(() => {
    const withDeadline = (assignmentsQuery.data ?? []).filter(
      (a: Assignment) => a.is_published && a.due_date
    );
    const dueTime = (a: Assignment) => new Date(a.due_date!).getTime();
    const future = withDeadline
      .filter((a) => dueTime(a) >= now)
      .sort((a, b) => dueTime(a) - dueTime(b))
      .slice(0, MAX_UPCOMING);
    const past = withDeadline
      .filter((a) => dueTime(a) < now && (viewerRole === "asprak" || !a.my_submission))
      .sort((a, b) => dueTime(b) - dueTime(a))
      .slice(0, Math.min(MAX_PAST, MAX_UPCOMING - future.length));
    return [...future, ...past].map((a) => ({ ...a, isPastDue: dueTime(a) < now }));
  }, [assignmentsQuery.data, now, viewerRole]);

  // Open session first, then the next one by local date, else the most recent one.
  const { session: featuredSession, isLast: isLastSession } = useMemo(() => {
    const sessions = (sessionsQuery.data ?? []) as CourseSession[];
    if (sessions.length === 0) return { session: null, isLast: false };

    const openSession = sessions.find((s) => s.attendance_status === "OPEN");
    if (openSession) return { session: openSession, isLast: false };

    const today = localDateKey(now);
    const future = sessions
      .filter((s) => s.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (future.length > 0) return { session: future[0], isLast: false };

    const latest = [...sessions].sort((a, b) => b.date.localeCompare(a.date))[0];
    return { session: latest, isLast: true };
  }, [sessionsQuery.data, now]);

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
            <ClockIcon className="w-4 h-4 text-slate-700" weight="bold" />
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

        {assignmentsQuery.isError ? (
          <LoadError
            message="Could not load assignments."
            onRetry={() => void assignmentsQuery.refetch()}
          />
        ) : upcomingAssignments.length === 0 ? (
          <div className="py-3 text-center">
            <CheckCircleIcon className="w-5 h-5 text-slate-400 mx-auto" />
            <p className="mt-1.5 text-xs font-medium text-slate-600">
              No assignments due soon.
            </p>
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
                    <CaretRightIcon className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-400 font-medium">
                      Due {formatDate(assignment.due_date)}
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
            <CalendarCheckIcon className="w-4 h-4 text-slate-700" weight="bold" />
            <span>{isLastSession ? "Last session" : "Next Session"}</span>
          </h3>

          <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-900 group-hover:underline transition-colors">
            View
          </span>
        </div>

        {sessionsQuery.isError ? (
          <LoadError
            message="Could not load sessions."
            onRetry={() => void sessionsQuery.refetch()}
          />
        ) : featuredSession ? (
          <div className="pt-1 space-y-2">
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-slate-950 transition-colors line-clamp-1">
                {featuredSession.title}
              </h4>
              <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
                {formatCalendarDate(featuredSession.date)}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-medium">
                Attendance
              </span>

              <SessionStatusBadge status={featuredSession.attendance_status} />
            </div>
          </div>
        ) : (
          <div className="py-2 text-center">
            <p className="text-xs text-slate-400">No scheduled sessions</p>
          </div>
        )}
      </div>

      {viewerRole === "praktikan" && recentGrades.length > 0 && (
        <div
          onClick={onNavigateToGrades ?? onNavigateToAssignments}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 cursor-pointer apple-card-hover transition-all group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              (onNavigateToGrades ?? onNavigateToAssignments)();
            }
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
              <GraduationCapIcon className="w-4 h-4 text-slate-700" weight="bold" />
              <span>Released Grades</span>
            </h3>

            <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-900 group-hover:underline transition-colors">
              View All
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {recentGrades.map((grade) => (
              <div
                key={grade.id}
                className="flex items-center justify-between py-1.5 border-t border-slate-100 text-xs"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-slate-900 truncate">
                    {grade.session_title}
                  </p>
                  <p className="text-[10px] text-slate-400">Assignment</p>
                </div>
                <span className="font-mono font-bold text-slate-900 shrink-0">
                  {formatScore(grade.score)}
                  <span className="text-[10px] text-slate-400 font-normal"> / {grade.max_points}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
