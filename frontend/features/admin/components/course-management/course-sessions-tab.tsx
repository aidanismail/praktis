"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  Download,
  Lock,
  Plus,
  Unlock,
  Users,
} from "lucide-react";
import type {
  Course,
  CourseSession,
  CourseStudent,
} from "@/features/admin/types";
import { getAttendanceExportUrl } from "@/features/admin/api/admin.api";
import { useSessionAttendance } from "@/features/admin/hooks/use-admin-course-workspace";
import { useModalFocusTrap } from "@/hooks/use-modal-focus-trap";

interface CourseSessionsTabProps {
  course: Course;
  sessions: CourseSession[];
  students: CourseStudent[];
  initialInspectingSessionId?: string | null;
  onCreateSession: (data: { title: string; date: string }) => Promise<void>;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function CourseSessionsTab({
  course,
  sessions,
  students,
  initialInspectingSessionId = null,
  onCreateSession,
  onSuccess,
  onError,
}: CourseSessionsTabProps) {
  const [inspectingSessionId, setInspectingSessionId] = useState<string | null>(
    initialInspectingSessionId
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingStudentAttendanceId, setUpdatingStudentAttendanceId] = useState<string | null>(null);

  const createSessionModalRef = useModalFocusTrap<HTMLDivElement>({
    isOpen: showCreateModal,
    onClose: () => setShowCreateModal(false),
  });

  const {
    attendanceList,
    isLoadingAttendance,
    toggleAttendance,
    updateAttendance,
  } = useSessionAttendance(inspectingSessionId, course.id);

  const attendanceMap = useMemo(() => {
    const map = new Map<string, (typeof attendanceList)[number]>();
    attendanceList.forEach((a) => map.set(a.student_id, a));
    return map;
  }, [attendanceList]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim() || !sessionDate) return;

    setIsSubmitting(true);
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
      onError(err instanceof Error ? err.message : "Couldn't create session. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleWindow = async (s: CourseSession) => {
    try {
      const shouldOpen = s.attendance_status !== "OPEN";
      await toggleAttendance(shouldOpen);
      onSuccess(
        shouldOpen
          ? "Attendance window is open."
          : "Attendance window closed."
      );
    } catch (err: unknown) {
      onError(
        err instanceof Error ? err.message : "Couldn't update attendance window. Please try again."
      );
    }
  };

  const handleUpdateRecord = async (
    studentId: string,
    status: "hadir" | "sakit" | "izin" | "alfa"
  ) => {
    setUpdatingStudentAttendanceId(studentId);
    try {
      const res = await updateAttendance([{ student_id: studentId, status }]);
      onSuccess(res?.message || "Attendance updated.");
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Couldn't update attendance. Please try again.");
    } finally {
      setUpdatingStudentAttendanceId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Action Bar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-700" />
          <span>Class Sessions & Live Attendance</span>
        </h3>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Session</span>
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center p-8 bg-white border border-dashed border-slate-200 rounded-3xl text-xs text-slate-400">
          No lab sessions scheduled yet. Click &quot;Add Session&quot; to plan one.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const isInspecting = inspectingSessionId === s.id;
            return (
              <div
                key={s.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden"
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{s.title}</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>Date: {s.date}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectingSessionId(isInspecting ? null : s.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isInspecting
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{isInspecting ? "Hide Attendance" : "Manage Attendance"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleWindow(s)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                        s.attendance_status === "OPEN"
                          ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {s.attendance_status === "OPEN" ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Close Window</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Open Window</span>
                        </>
                      )}
                    </button>

                    <a
                      href={getAttendanceExportUrl(s.id, "csv")}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-full text-xs flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </a>
                  </div>
                </div>

                {/* Expanded Interactive Attendance Roster */}
                {isInspecting && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">
                        Attendance Roster for {s.title}
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {students.length} {students.length === 1 ? "student" : "students"} enrolled
                      </span>
                    </div>

                    {isLoadingAttendance ? (
                      <p className="text-xs text-slate-400 py-4 text-center">
                        Loading attendance...
                      </p>
                    ) : students.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">
                        No students enrolled in this course yet.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-200/60 bg-white rounded-2xl border border-slate-200 overflow-hidden text-xs">
                        {students.map((st) => {
                          const record = attendanceMap.get(st.id);
                          const currentStatus = record ? record.status : "Belum Absen";
                          const isUpdatingThis = updatingStudentAttendanceId === st.id;

                          return (
                            <div
                              key={st.id}
                              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50"
                            >
                              <div>
                                <span className="font-semibold text-slate-900 block">
                                  {st.username}
                                </span>
                                <span className="text-[11px] text-slate-400">{st.email}</span>
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
                                        disabled={isUpdatingThis}
                                        className={`px-3 py-1 text-[10px] font-semibold capitalize rounded-full transition-all cursor-pointer ${
                                          isCurrent
                                            ? "bg-slate-900 text-white shadow-xs"
                                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          <form
            onSubmit={handleCreateSubmit}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-apple-modal"
          >
            <h4 id="create-session-modal-title" className="font-bold text-sm text-slate-900">
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
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Session Date</label>
                <input
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
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 shadow-xs cursor-pointer"
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

