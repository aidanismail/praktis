"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useModalFocusTrap } from "@/hooks/use-modal-focus-trap";
import { getSessionDetailRoute } from "@/constants/routes";
import {
  useCourseSessions,
  useCreateCourseSession,
  useDeleteCourseSession,
  useTransitionSessionAttendance,
  useUpdateCourseSession
} from "../hooks/use-course-sessions";
import { SessionDateEditor } from "./session-date-editor";
import { SessionTitleEditor } from "./session-title-editor";
import { SessionStatusBadge } from "./session-status-badge";
import { downloadSessionAttendanceExport } from "@/features/exports/api/session-exports.api";
import { useExportDownload } from "@/features/exports/hooks/use-export-download";
import type { CourseSession } from "../types/session.type";
import {
  CalendarBlankIcon,
  DownloadSimpleIcon,
  LockIcon,
  LockOpenIcon,
  PlusIcon,
  TrashIcon,
  ArrowsClockwiseIcon,
  ClipboardTextIcon,
  XIcon
} from "@phosphor-icons/react";

type CourseSessionsProps = {
  userId: string;
  courseId: string;
  onSelectSession?: (sessionId: string) => void;
};

export function CourseSessions({
  userId,
  courseId,
  onSelectSession
}: CourseSessionsProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const exportDownload = useExportDownload();

  const createSessionModalRef = useModalFocusTrap<HTMLDivElement>({
    isOpen: showCreateModal,
    onClose: () => setShowCreateModal(false)
  });

  const sessionsQuery = useCourseSessions({
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
  const updateMutation = useUpdateCourseSession({ userId, courseId });

  const sessions = useMemo(() => {
    return [...(sessionsQuery.data ?? [])].sort((a, b) => {
      const byDate = a.date.localeCompare(b.date);
      if (byDate !== 0) return byDate;
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    });
  }, [sessionsQuery.data]);

  const openSessionRecord = sessions.find((s) => s.attendance_status === "OPEN");

  const openSession = (sessionId: string) => {
    if (onSelectSession) {
      onSelectSession(sessionId);
    } else {
      router.push(getSessionDetailRoute(courseId, sessionId));
    }
  };

  const handleCreateSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim() || !sessionDate) return;

    setCreateError(null);
    try {
      await createMutation.mutateAsync({
        title: sessionTitle.trim(),
        date: sessionDate
      });
      setShowCreateModal(false);
      setSessionTitle("");
      setSessionDate("");
    } catch (err) {
      setCreateError(getApiErrorMessage(err, "Couldn't create session. Please try again."));
    }
  };

  const handleToggleWindow = async (s: CourseSession) => {
    const shouldOpen = s.attendance_status !== "OPEN";
    setActionError(null);
    try {
      await transitionMutation.mutateAsync({
        sessionId: s.id,
        action: shouldOpen ? "open" : "close"
      });
    } catch (err) {
      setActionError(
        getApiErrorMessage(err, "Couldn't update the attendance window. Please try again.")
      );
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(sessionId);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Couldn't delete session. Please try again."));
    } finally {
      setDeletingSessionId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Action Bar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Class Sessions &amp; Attendance
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void sessionsQuery.refetch()}
            disabled={sessionsQuery.isFetching}
            className="apple-press p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            title="Refresh sessions"
            aria-label="Refresh sessions"
          >
            <ArrowsClockwiseIcon
              className={`w-3.5 h-3.5 ${
                sessionsQuery.isFetching ? "animate-spin" : ""
              }`}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setShowCreateModal(true);
            }}
            className="apple-press px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add Session</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-800 flex items-center justify-between gap-3"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-600 hover:text-rose-900"
            aria-label="Dismiss"
          >
            <XIcon className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {exportDownload.error && (
        <div
          role="alert"
          className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-800 flex items-center justify-between gap-3"
        >
          <span>{exportDownload.error}</span>
          <button
            type="button"
            onClick={exportDownload.clearError}
            className="text-rose-600 hover:text-rose-900"
            aria-label="Dismiss export error"
          >
            <XIcon className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

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
            const isTransitioning =
              transitionMutation.isPending &&
              transitionMutation.variables?.sessionId === s.id;
            const blockedByOtherOpen =
              s.attendance_status !== "OPEN" && Boolean(openSessionRecord);
            const isDeleting =
              deleteMutation.isPending && deleteMutation.variables === s.id;

            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <SessionTitleEditor
                        title={s.title}
                        onSave={async (title) => {
                          await updateMutation.mutateAsync({
                            sessionId: s.id,
                            payload: { title }
                          });
                        }}
                      />
                      <SessionStatusBadge status={s.attendance_status} />
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-slate-400">
                      <CalendarBlankIcon className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <SessionDateEditor
                        date={s.date}
                        onSave={async (date) => {
                          await updateMutation.mutateAsync({
                            sessionId: s.id,
                            payload: { date }
                          });
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openSession(s.id)}
                      className="apple-press px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ClipboardTextIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Attendance Register</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleWindow(s)}
                      disabled={isTransitioning || blockedByOtherOpen}
                      title={blockedByOtherOpen ? `Lock '${openSessionRecord?.title}' first` : undefined}
                      className={`apple-press px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                        s.attendance_status === "OPEN"
                          ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {s.attendance_status === "OPEN" ? (
                        <>
                          <LockIcon className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Lock</span>
                        </>
                      ) : (
                        <>
                          <LockOpenIcon className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Open</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void exportDownload.run(s.id, () =>
                          downloadSessionAttendanceExport(s.id, "csv")
                        )
                      }
                      disabled={exportDownload.busyKey !== null}
                      className="apple-press px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-full text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-60"
                      title="Export attendance CSV"
                      aria-label={`Export attendance CSV for ${s.title}`}
                    >
                      <DownloadSimpleIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{exportDownload.busyKey === s.id ? "Preparing..." : "CSV"}</span>
                    </button>

                    {deletingSessionId === s.id ? (
                      <div className="flex items-center gap-1 text-xs">
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(s.id)}
                          disabled={isDeleting}
                          className="px-2.5 py-1 bg-rose-600 text-white rounded-full font-semibold hover:bg-rose-700 disabled:opacity-50"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingSessionId(null)}
                          disabled={isDeleting}
                          className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 disabled:opacity-50"
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
                        aria-label={`Delete session ${s.title}`}
                      >
                        <TrashIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
                {deletingSessionId === s.id && (
                  <p
                    role="alert"
                    className="border-t border-rose-100 bg-rose-50 px-4 py-2 text-[11px] text-rose-800 sm:px-5"
                  >
                    Attendance records for this session will be deleted. Linked assignments are kept.
                  </p>
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
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center overflow-y-auto p-4 transition-opacity animate-in fade-in duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          <form
            onSubmit={handleCreateSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md max-h-[90dvh] overflow-y-auto shadow-xl space-y-4 animate-apple-modal"
          >
            <h4
              id="asprak-create-session-title"
              className="font-bold text-sm text-slate-900"
            >
              Schedule a Session
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label
                  htmlFor="asprak-session-title"
                  className="block font-semibold text-slate-600 mb-1"
                >
                  Session Title
                </label>
                <input
                  id="asprak-session-title"
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  required
                  placeholder="e.g. Lab 1 - Introduction & Setup"
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="asprak-session-date"
                  className="block font-semibold text-slate-600 mb-1"
                >
                  Session Date
                </label>
                <input
                  id="asprak-session-date"
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>
            </div>

            {createError && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
                {createError}
              </p>
            )}

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
                disabled={createMutation.isPending}
                className="apple-press px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 shadow-xs cursor-pointer disabled:opacity-60"
              >
                {createMutation.isPending ? "Saving..." : "Add Session"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
