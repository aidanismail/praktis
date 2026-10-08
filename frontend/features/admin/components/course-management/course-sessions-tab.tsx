"use client";

import React, { useState } from "react";
import type { CourseSession } from "@/features/admin/types";
import { getAttendanceExportUrl } from "@/features/admin/api/admin.api";
import { useAuthStore } from "@/stores/auth-store";
import { useModalFocusTrap } from "@/hooks/use-modal-focus-trap";
import { SessionTitleEditor } from "@/features/sessions/components/session-title-editor";
import { SessionDateEditor } from "@/features/sessions/components/session-date-editor";
import { SessionStatusBadge } from "@/features/sessions/components/session-status-badge";
import { SessionAttendanceRegister } from "@/features/attendance/components/session-attendance-register";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import {
  DownloadSimpleIcon,
  LockIcon,
  PlusIcon,
  LockOpenIcon,
  TrashIcon,
  UsersIcon
} from "@phosphor-icons/react";

interface CourseSessionsTabProps {
  courseId: string;
  sessions: CourseSession[];
  isLoading: boolean;
  onCreateSession: (data: { title: string; date: string }) => Promise<unknown>;
  onRenameSession: (sessionId: string, title: string) => Promise<unknown>;
  onChangeSessionDate: (sessionId: string, date: string) => Promise<unknown>;
  onSetSessionWindow: (sessionId: string, open: boolean) => Promise<unknown>;
  onDeleteSession: (sessionId: string) => Promise<unknown>;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function CourseSessionsTab({
  courseId,
  sessions,
  isLoading,
  onCreateSession,
  onRenameSession,
  onChangeSessionDate,
  onSetSessionWindow,
  onDeleteSession,
  onSuccess,
  onError,
}: CourseSessionsTabProps) {
  const userId = useAuthStore((state) => state.user?.id) ?? "";
  const [inspectingSessionId, setInspectingSessionId] = useState<string | null>(null);
  const [registerDirty, setRegisterDirty] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [togglingSessionId, setTogglingSessionId] = useState<string | null>(null);
  const [confirmDeleteSessionId, setConfirmDeleteSessionId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateError(null);
  };

  const createSessionModalRef = useModalFocusTrap<HTMLDivElement>({
    isOpen: showCreateModal,
    onClose: closeCreateModal,
  });

  // The backend allows only one OPEN session per course.
  const openSession = sessions.find((s) => s.attendance_status === "OPEN") ?? null;

  const toggleInspecting = (sessionId: string) => {
    if (
      registerDirty &&
      !window.confirm("You have unsaved attendance changes. Leave without saving?")
    ) {
      return;
    }
    setRegisterDirty(false);
    setInspectingSessionId(inspectingSessionId === sessionId ? null : sessionId);
  };

  const handleCreateSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim() || !sessionDate) return;

    setIsSubmitting(true);
    setCreateError(null);
    try {
      await onCreateSession({
        title: sessionTitle.trim(),
        date: sessionDate,
      });
      setShowCreateModal(false);
      setSessionTitle("");
      setSessionDate("");
      onSuccess("Session scheduled.");
    } catch (err: unknown) {
      setCreateError(
        err instanceof Error ? err.message : "Couldn't create session. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleWindow = async (s: CourseSession) => {
    const shouldOpen = s.attendance_status !== "OPEN";
    if (
      !shouldOpen &&
      registerDirty &&
      inspectingSessionId === s.id &&
      !window.confirm("You have unsaved attendance changes. Lock anyway and discard them?")
    ) {
      return;
    }
    setTogglingSessionId(s.id);
    try {
      await onSetSessionWindow(s.id, shouldOpen);
      if (!shouldOpen && inspectingSessionId === s.id) setRegisterDirty(false);
      onSuccess(
        shouldOpen
          ? `Attendance for "${s.title}" is open for editing.`
          : `Attendance for "${s.title}" is locked.`
      );
    } catch (err: unknown) {
      onError(
        err instanceof Error ? err.message : "Couldn't update attendance window. Please try again."
      );
    } finally {
      setTogglingSessionId(null);
    }
  };

  const handleDeleteSession = async (s: CourseSession) => {
    setDeletingSessionId(s.id);
    try {
      await onDeleteSession(s.id);
      if (inspectingSessionId === s.id) {
        setInspectingSessionId(null);
        setRegisterDirty(false);
      }
      setConfirmDeleteSessionId(null);
      onSuccess(`Session "${s.title}" deleted.`);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Couldn't delete session. Please try again.");
    } finally {
      setDeletingSessionId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Action Bar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Class Sessions & Live Attendance
        </h3>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="apple-press px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          <span>Add Session</span>
        </button>
      </div>

      {isLoading ? (
        <div role="status" className="flex items-center justify-center gap-3 p-8 bg-white border border-slate-200 rounded-2xl text-xs text-slate-500">
          <AsteriskLoader className="h-4 w-4" />
          <span>Loading sessions...</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center p-8 bg-white border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
          No lab sessions scheduled yet. Click &quot;Add Session&quot; to plan one.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const isInspecting = inspectingSessionId === s.id;
            const blockedByOpen =
              s.attendance_status !== "OPEN" && openSession !== null;
            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <SessionTitleEditor
                        title={s.title}
                        onSave={async (title) => {
                          await onRenameSession(s.id, title);
                          onSuccess("Session renamed.");
                        }}
                      />
                      <SessionStatusBadge status={s.attendance_status} />
                    </div>
                    <div className="mt-0.5">
                      <SessionDateEditor
                        date={s.date}
                        onSave={async (date) => {
                          await onChangeSessionDate(s.id, date);
                          onSuccess("Session date updated.");
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => toggleInspecting(s.id)}
                      aria-expanded={isInspecting}
                      className={`apple-press px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isInspecting
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <UsersIcon className="w-3.5 h-3.5" />
                      <span>{isInspecting ? "Hide Attendance" : "Manage Attendance"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleWindow(s)}
                      disabled={togglingSessionId === s.id || blockedByOpen}
                      title={
                        blockedByOpen && openSession
                          ? `Lock "${openSession.title}" first`
                          : undefined
                      }
                      className={`apple-press px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                        s.attendance_status === "OPEN"
                          ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {s.attendance_status === "OPEN" ? (
                        <>
                          <LockIcon className="w-3.5 h-3.5" />
                          <span>Lock</span>
                        </>
                      ) : (
                        <>
                          <LockOpenIcon className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </>
                      )}
                    </button>

                    <a
                      href={getAttendanceExportUrl(s.id, "csv")}
                      className="apple-press px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-full text-xs flex items-center gap-1 transition-colors"
                    >
                      <DownloadSimpleIcon className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </a>

                    {confirmDeleteSessionId === s.id ? (
                      <div className="flex items-center gap-1 text-xs">
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(s)}
                          disabled={deletingSessionId === s.id}
                          className="px-2.5 py-1 bg-rose-600 text-white rounded-full font-semibold hover:bg-rose-700 disabled:opacity-50"
                        >
                          {deletingSessionId === s.id ? "Deleting..." : "Delete"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteSessionId(null)}
                          disabled={deletingSessionId === s.id}
                          className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteSessionId(s.id)}
                        className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete session"
                        aria-label={`Delete session ${s.title}`}
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded bulk attendance register (draft, then save) */}
                {isInspecting && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900">
                      Attendance Register for {s.title}
                    </h4>
                    {userId ? (
                      <SessionAttendanceRegister
                        userId={userId}
                        courseId={courseId}
                        session={s}
                        onDirtyChange={setRegisterDirty}
                      />
                    ) : null}
                  </div>
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
          aria-labelledby="create-session-modal-title"
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4 transition-opacity animate-in fade-in duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          <form
            onSubmit={handleCreateSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md max-h-[90dvh] overflow-y-auto shadow-xl space-y-4 animate-apple-modal"
          >
            <h4 id="create-session-modal-title" className="font-bold text-sm text-slate-900">
              Schedule a Session
            </h4>
            {createError && (
              <NotificationBanner variant="error" message={createError} />
            )}
            <div className="space-y-3 text-xs">
              <div>
                <label
                  htmlFor="create-session-title"
                  className="block font-semibold text-slate-600 mb-1"
                >
                  Session Title
                </label>
                <input
                  id="create-session-title"
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  required
                  placeholder="e.g. Lab 1 - Introduction & Setup"
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="create-session-date"
                  className="block font-semibold text-slate-600 mb-1"
                >
                  Session Date
                </label>
                <input
                  id="create-session-date"
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={closeCreateModal}
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

