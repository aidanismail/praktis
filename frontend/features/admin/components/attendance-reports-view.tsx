"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminCourses,
  fetchCourseSessions,
  openSessionAttendance,
  closeSessionAttendance,
} from "../api/admin.api";
import { adminQueryKeys } from "../constants/admin-query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { SessionAttendanceRegister } from "@/features/attendance/components/session-attendance-register";
import { SessionStatusBadge } from "@/features/sessions/components/session-status-badge";
import { formatCalendarDate } from "@/lib/format/date";
import {
  LockIcon,
  LockOpenIcon,
} from "@phosphor-icons/react";

const SELECT_CLASS =
  "w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900";
const LABEL_CLASS = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5";
const UNSAVED_MESSAGE = "You have unsaved attendance changes. Leave without saving?";

function QueryError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <NotificationBanner variant="error">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span>{message}</span>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 transition"
        >
          Retry
        </button>
      </div>
    </NotificationBanner>
  );
}

export function AttendanceReportsView() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id) ?? "";

  const [pickedCourseId, setPickedCourseId] = useState<string>("");
  const [pickedSessionId, setPickedSessionId] = useState<string>("");
  const [registerDirty, setRegisterDirty] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const coursesQuery = useQuery({
    queryKey: adminQueryKeys.courses(),
    queryFn: fetchAdminCourses,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const courses = coursesQuery.data ?? [];
  const selectedCourseId = courses.some((c) => c.id === pickedCourseId)
    ? pickedCourseId
    : (courses[0]?.id ?? "");

  const sessionsQuery = useQuery({
    queryKey: adminQueryKeys.courseSessions(selectedCourseId),
    queryFn: () => fetchCourseSessions(selectedCourseId),
    enabled: Boolean(selectedCourseId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const sessions = sessionsQuery.data ?? [];
  // The selection survives refetches (e.g. after Open/Lock); it only falls back to the first
  // session when the picked one no longer exists.
  const selectedSessionId = sessions.some((s) => s.id === pickedSessionId)
    ? pickedSessionId
    : (sessions[0]?.id ?? "");
  const currentSession = sessions.find((s) => s.id === selectedSessionId);

  // The backend allows only one OPEN session per course.
  const openSession = sessions.find((s) => s.attendance_status === "OPEN") ?? null;
  const openBlockedBy =
    openSession && currentSession && openSession.id !== currentSession.id
      ? openSession
      : null;

  const windowMutation = useMutation({
    mutationFn: ({ sessionId, open }: { sessionId: string; open: boolean }) =>
      open ? openSessionAttendance(sessionId) : closeSessionAttendance(sessionId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.courseSessions(selectedCourseId),
      }),
  });

  const confirmLeave = () => !registerDirty || window.confirm(UNSAVED_MESSAGE);

  const handleSelectCourse = (courseId: string) => {
    if (courseId === selectedCourseId || !confirmLeave()) return;
    setRegisterDirty(false);
    setPickedCourseId(courseId);
    setPickedSessionId("");
  };

  const handleSelectSession = (sessionId: string) => {
    if (sessionId === selectedSessionId || !confirmLeave()) return;
    setRegisterDirty(false);
    setPickedSessionId(sessionId);
  };

  const handleSetWindow = async (open: boolean) => {
    if (!currentSession) return;
    if (
      !open &&
      registerDirty &&
      !window.confirm("You have unsaved attendance changes. Lock anyway and discard them?")
    ) {
      return;
    }
    setError(null);
    setActionSuccess(null);

    try {
      const res = await windowMutation.mutateAsync({ sessionId: currentSession.id, open });
      if (!open) setRegisterDirty(false);
      setActionSuccess(
        res.message ||
          (open ? "Attendance window is open." : "Attendance window locked.")
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : `Couldn't ${open ? "open" : "lock"} attendance window. Please try again.`
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert Notifications */}
      {(actionSuccess || error) && (
        <div className="space-y-2">
          {actionSuccess && (
            <NotificationBanner
              variant="success"
              message={actionSuccess}
              onClose={() => setActionSuccess(null)}
            />
          )}
          {error && (
            <NotificationBanner
              variant="error"
              message={error}
              onClose={() => setError(null)}
            />
          )}
        </div>
      )}

      {/* Select Course & Session Filter Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="attendance-course" className={LABEL_CLASS}>
              Course
            </label>
            {coursesQuery.isLoading ? (
              <p className="text-xs text-slate-400 py-2">Loading courses...</p>
            ) : coursesQuery.isError ? (
              <QueryError
                message="Couldn't load courses."
                onRetry={() => void coursesQuery.refetch()}
              />
            ) : courses.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No courses available yet.</p>
            ) : (
              <select
                id="attendance-course"
                value={selectedCourseId}
                onChange={(e) => handleSelectCourse(e.target.value)}
                className={SELECT_CLASS}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} ({c.academic_year} {c.semester})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="attendance-session" className={LABEL_CLASS}>
              Session
            </label>
            {!selectedCourseId ? (
              <p className="text-xs text-slate-400 py-2">Pick a course first.</p>
            ) : sessionsQuery.isLoading ? (
              <p className="text-xs text-slate-400 py-2">Loading sessions...</p>
            ) : sessionsQuery.isError ? (
              <QueryError
                message="Couldn't load sessions."
                onRetry={() => void sessionsQuery.refetch()}
              />
            ) : sessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No sessions scheduled yet.</p>
            ) : (
              <select
                id="attendance-session"
                value={selectedSessionId}
                onChange={(e) => handleSelectSession(e.target.value)}
                className={SELECT_CLASS}
              >
                {sessions.map((s, idx) => (
                  <option key={s.id} value={s.id}>
                    Session #{idx + 1}: {s.title} ({formatCalendarDate(s.date)}) -{" "}
                    {s.attendance_status === "OPEN"
                      ? "Open"
                      : s.attendance_status === "CLOSED"
                        ? "Locked"
                        : "Scheduled"}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Live window control */}
        {currentSession && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200/80 p-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-slate-900">Attendance</p>
                <SessionStatusBadge status={currentSession.attendance_status} />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {currentSession.attendance_status === "OPEN"
                  ? "Record attendance below, then lock the session to finalize it."
                  : "Records are read-only. Open the session to make changes."}
              </p>
            </div>

            {currentSession.attendance_status === "OPEN" ? (
              <button
                type="button"
                onClick={() => handleSetWindow(false)}
                disabled={windowMutation.isPending}
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <LockIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{windowMutation.isPending ? "Locking..." : "Lock"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSetWindow(true)}
                disabled={windowMutation.isPending || openBlockedBy !== null}
                title={openBlockedBy ? `Lock "${openBlockedBy.title}" first` : undefined}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <LockOpenIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{windowMutation.isPending ? "Opening..." : "Open for editing"}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Attendance register (draft, then save) */}
      {currentSession && userId ? (
        <SessionAttendanceRegister
          key={currentSession.id}
          userId={userId}
          courseId={selectedCourseId}
          session={currentSession}
          onDirtyChange={setRegisterDirty}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 shadow-xs">
          Pick a session above to view and manage attendance.
        </div>
      )}
    </div>
  );
}
