"use client";

import React, { useState, useMemo } from "react";
import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { useModalFocusTrap } from "@/hooks/use-modal-focus-trap";
import {
  useCourseSessions,
  useCreateCourseSession,
  useDeleteCourseSession,
  useTransitionSessionAttendance
} from "../hooks/use-course-sessions";
import { useCourseRoster } from "@/features/courses/hooks/use-course-roster";
import {
  useSessionAttendance,
  useSaveSessionAttendance
} from "@/features/attendance/hooks/use-session-attendance";
import { getAttendanceExportUrl } from "@/features/admin/api/admin.api";
import type { CourseSession } from "../types/session.type";
import type { AttendanceStatus } from "@/features/attendance/types/attendance.type";
import {
  CalendarBlankIcon,
  DownloadSimpleIcon,
  LockIcon,
  LockOpenIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
  ArrowsClockwiseIcon
} from "@phosphor-icons/react";

type CourseSessionsProps = {
  userId: string;
  courseId: string;
  initialInspectingSessionId?: string | null;
};

const ATTENDANCE_STATUS_STYLES: Record<AttendanceStatus, string> = {
  hadir: "bg-cyan-50 text-cyan-800 font-bold border-cyan-200/60",
  sakit: "bg-sky-50 text-sky-700 font-bold border-sky-200/60",
  izin: "bg-amber-50 text-amber-700 font-bold border-amber-200/60",
  alfa: "bg-rose-50 text-rose-700 font-bold border-rose-200/60",
};

function SessionAttendanceRoster({
  sessionId,
  sessionTitle,
  courseId,
  userId,
  students,
}: {
  sessionId: string;
  sessionTitle: string;
  courseId: string;
  userId: string;
  students: { id: string; username: string; email?: string }[];
}) {
  const query = useSessionAttendance({
    userId,
    courseId,
    sessionId,
    enabled: true
  });
  const saveMutation = useSaveSessionAttendance({ userId, courseId, sessionId });
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);

  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    (query.data ?? []).forEach((record) => {
      map.set(record.student_id, record.status);
    });
    return map;
  }, [query.data]);

  const handleUpdateRecord = async (
    studentId: string,
    status: AttendanceStatus
  ) => {
    setUpdatingStudentId(studentId);
    try {
      await saveMutation.mutateAsync({
        records: [{ student_id: studentId, status }]
      });
    } finally {
      setUpdatingStudentId(null);
    }
  };

  return (
    <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-900">
          Attendance Roster for {sessionTitle}
        </h4>
        <span className="text-[11px] text-slate-500">
          {students.length} {students.length === 1 ? "student" : "students"} enrolled
        </span>
      </div>

      {query.isPending ? (
        <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-500">
          <AsteriskLoader className="w-4 h-4 text-slate-400" />
          <span>Loading attendance records...</span>
        </div>
      ) : query.isError ? (
        <div className="py-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4">
          Couldn&apos;t load attendance records.
        </div>
      ) : students.length === 0 ? (
        <p className="text-xs text-slate-400 py-3 text-center">
          No students enrolled in this course yet.
        </p>
      ) : (
        <div className="divide-y divide-slate-200/60 bg-white rounded-2xl border border-slate-200 overflow-hidden text-xs">
          {students.map((st) => {
            const currentStatus = attendanceMap.get(st.id);
            const isUpdating = updatingStudentId === st.id;

            return (
              <div
                key={st.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <span className="font-semibold text-slate-900 block">
                    {st.username}
                  </span>
                  {st.email && (
                    <span className="text-[11px] text-slate-400">{st.email}</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {(["hadir", "sakit", "izin", "alfa"] as const).map(
                    (statusOption) => {
                      const isCurrent = currentStatus === statusOption;
                      return (
                        <button
                          key={statusOption}
                          type="button"
                          onClick={() => handleUpdateRecord(st.id, statusOption)}
                          disabled={isUpdating}
                          className={`apple-press px-3 py-1 text-[10px] font-semibold capitalize rounded-full transition-all cursor-pointer border ${
                            isCurrent
                              ? ATTENDANCE_STATUS_STYLES[statusOption]
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          } disabled:opacity-50`}
                        >
                          {statusOption}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CourseSessions({
  userId,
  courseId,
  initialInspectingSessionId = null
}: CourseSessionsProps) {
  const [inspectingSessionId, setInspectingSessionId] = useState<string | null>(
    initialInspectingSessionId
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const createSessionModalRef = useModalFocusTrap<HTMLDivElement>({
    isOpen: showCreateModal,
    onClose: () => setShowCreateModal(false)
  });

  const sessionsQuery = useCourseSessions({
    userId,
    courseId,
    enabled: true
  });
  const rosterQuery = useCourseRoster({
    userId,
    courseId,
    enabled: true
  });
  const createMutation = useCreateCourseSession({ userId, courseId });
  const transitionMutation = useTransitionSessionAttendance({
    userId,
    courseId
  });
  const deleteMutation = useDeleteCourseSession({ userId, courseId });

  const sessions = useMemo(() => {
    return [...(sessionsQuery.data ?? [])].sort((a, b) => {
      const byDate = a.date.localeCompare(b.date);
      if (byDate !== 0) return byDate;
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    });
  }, [sessionsQuery.data]);

  const students = rosterQuery.data ?? [];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim() || !sessionDate) return;

    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({
        title: sessionTitle.trim(),
        date: sessionDate
      });
      setShowCreateModal(false);
      setSessionTitle("");
      setSessionDate("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleWindow = async (s: CourseSession) => {
    const shouldOpen = s.attendance_status !== "OPEN";
    await transitionMutation.mutateAsync({
      sessionId: s.id,
      action: shouldOpen ? "open" : "close"
    });
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteMutation.mutateAsync(sessionId);
      if (inspectingSessionId === sessionId) {
        setInspectingSessionId(null);
      }
    } finally {
      setDeletingSessionId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Action Bar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Class Sessions &amp; Live Attendance
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void sessionsQuery.refetch()}
            disabled={sessionsQuery.isFetching}
            className="apple-press p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            title="Refresh sessions"
          >
            <ArrowsClockwiseIcon
              className={`w-3.5 h-3.5 ${
                sessionsQuery.isFetching ? "animate-spin" : ""
              }`}
            />
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="apple-press px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Add Session</span>
          </button>
        </div>
      </div>

      {sessionsQuery.isPending ? (
        <div className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <AsteriskLoader className="h-5 w-5 text-slate-900" aria-hidden="true" />
          <span className="ml-3 text-xs text-slate-600">
            Loading class sessions...
          </span>
        </div>
      ) : sessionsQuery.isError ? (
        <NotificationBanner variant="error">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-white">Couldn&apos;t load sessions</h4>
              <p className="mt-0.5 text-xs text-slate-300">
                Please check your network connection and try again.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void sessionsQuery.refetch()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
            >
              Retry
            </button>
          </div>
        </NotificationBanner>
      ) : sessions.length === 0 ? (
        <div className="text-center p-8 bg-white border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
          No lab sessions scheduled yet. Click &quot;Add Session&quot; to plan one.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const isInspecting = inspectingSessionId === s.id;
            const isTransitioning =
              transitionMutation.isPending &&
              transitionMutation.variables?.sessionId === s.id;

            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 block">
                        {s.title}
                      </span>
                      {s.attendance_status === "OPEN" ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                          Open
                        </span>
                      ) : s.attendance_status === "CLOSED" ? (
                        <span className="text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          Closed
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                          Scheduled
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <CalendarBlankIcon className="w-3 h-3" />
                      <span>Date: {s.date}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        setInspectingSessionId(isInspecting ? null : s.id)
                      }
                      className={`apple-press px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isInspecting
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <UsersIcon className="w-3.5 h-3.5" />
                      <span>
                        {isInspecting ? "Hide Attendance" : "Manage Attendance"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleWindow(s)}
                      disabled={isTransitioning}
                      className={`apple-press px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                        s.attendance_status === "OPEN"
                          ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      } disabled:opacity-60`}
                    >
                      {s.attendance_status === "OPEN" ? (
                        <>
                          <LockIcon className="w-3.5 h-3.5" />
                          <span>Close</span>
                        </>
                      ) : (
                        <>
                          <LockOpenIcon className="w-3.5 h-3.5" />
                          <span>Open Window</span>
                        </>
                      )}
                    </button>

                    <a
                      href={getAttendanceExportUrl(s.id, "csv")}
                      className="apple-press px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-full text-xs flex items-center gap-1 transition-colors"
                      title="Export attendance CSV"
                    >
                      <DownloadSimpleIcon className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </a>

                    {deletingSessionId === s.id ? (
                      <div className="flex items-center gap-1 text-xs">
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(s.id)}
                          disabled={deleteMutation.isPending}
                          className="px-2.5 py-1 bg-rose-600 text-white rounded-full font-semibold hover:bg-rose-700 disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingSessionId(null)}
                          className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingSessionId(s.id)}
                        className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete session"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {isInspecting && (
                  <SessionAttendanceRoster
                    sessionId={s.id}
                    sessionTitle={s.title}
                    courseId={courseId}
                    userId={userId}
                    students={students}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <div
          ref={createSessionModalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="asprak-create-session-title"
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          <form
            onSubmit={handleCreateSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-xl space-y-4 animate-apple-modal"
          >
            <h4
              id="asprak-create-session-title"
              className="font-bold text-sm text-slate-900"
            >
              Schedule a Session
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Session Title
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  required
                  placeholder="e.g. Lab 1 - Introduction & Setup"
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Session Date
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="apple-press px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="apple-press px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : "Add Session"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
