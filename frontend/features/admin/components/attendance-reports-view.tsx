"use client";

import { useEffect, useState } from "react";
import { Lock, Unlock, X, AlertCircle, CheckCircle2, UserCheck } from "lucide-react";
import {
  fetchAdminCourses,
  fetchCourseSessions,
  fetchCourseStudents,
  fetchSessionAttendance,
  openSessionAttendance,
  closeSessionAttendance,
  updateSessionAttendance,
} from "../api/admin.api";
import type { Course } from "@/features/courses/types/course.type";
import type { ClassSessionItem, StudentItem, AttendanceItem } from "../types/admin.type";

export function AttendanceReportsView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<ClassSessionItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [attendances, setAttendances] = useState<AttendanceItem[]>([]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isUpdatingSession, setIsUpdatingSession] = useState(false);
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Auto-dismiss notification banners
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

  const loadSessionsAndStudents = async (courseId: string) => {
    setIsLoadingSessions(true);
    try {
      const [sList, stList] = await Promise.all([
        fetchCourseSessions(courseId).catch(() => []),
        fetchCourseStudents(courseId).catch(() => []),
      ]);
      setSessions(sList);
      setStudents(stList);
      if (sList.length > 0) {
        setSelectedSessionId(sList[0].id);
      } else {
        setSelectedSessionId("");
      }
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadCourses() {
      try {
        const data = await fetchAdminCourses();
        if (isMounted) {
          setCourses(data);
          if (data.length > 0) {
            setSelectedCourseId(data[0].id);
          }
        }
      } catch {
        if (isMounted) {
          setCourses([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCourses(false);
        }
      }
    }
    loadCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    let isMounted = true;

    async function loadData() {
      setIsLoadingSessions(true);
      try {
        const [sList, stList] = await Promise.all([
          fetchCourseSessions(selectedCourseId).catch(() => []),
          fetchCourseStudents(selectedCourseId).catch(() => []),
        ]);
        if (isMounted) {
          setSessions(sList);
          setStudents(stList);
          if (sList.length > 0) {
            setSelectedSessionId(sList[0].id);
          } else {
            setSelectedSessionId("");
          }
        }
      } finally {
        if (isMounted) {
          setIsLoadingSessions(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedSessionId) {
      return;
    }
    let isMounted = true;
    async function loadRecords() {
      setIsLoadingAttendance(true);
      try {
        const aList = await fetchSessionAttendance(selectedSessionId).catch(() => []);
        if (isMounted) {
          setAttendances(aList);
        }
      } finally {
        if (isMounted) {
          setIsLoadingAttendance(false);
        }
      }
    }
    loadRecords();
    return () => {
      isMounted = false;
    };
  }, [selectedSessionId]);

  const handleOpenAttendance = async () => {
    if (!selectedSessionId) return;
    setIsUpdatingSession(true);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await openSessionAttendance(selectedSessionId);
      setActionSuccess(res.message || "Attendance window is open.");
      await loadSessionsAndStudents(selectedCourseId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't open attendance window. Please try again.");
    } finally {
      setIsUpdatingSession(false);
    }
  };

  const handleCloseAttendance = async () => {
    if (!selectedSessionId) return;
    setIsUpdatingSession(true);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await closeSessionAttendance(selectedSessionId);
      setActionSuccess(res.message || "Attendance window closed.");
      await loadSessionsAndStudents(selectedCourseId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't close attendance window. Please try again.");
    } finally {
      setIsUpdatingSession(false);
    }
  };

  const handleUpdateStudentStatus = async (
    studentId: string,
    newStatus: "hadir" | "sakit" | "izin" | "alfa"
  ) => {
    if (!selectedSessionId) return;
    setUpdatingStudentId(studentId);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await updateSessionAttendance(selectedSessionId, [
        { student_id: studentId, status: newStatus },
      ]);
      setActionSuccess(res.message || "Attendance updated.");
      const updatedList = await fetchSessionAttendance(selectedSessionId).catch(() => []);
      setAttendances(updatedList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't update attendance. Please try again.");
    } finally {
      setUpdatingStudentId(null);
    }
  };

  const handleMarkAllPresent = async () => {
    if (!selectedSessionId || students.length === 0) return;
    setUpdatingStudentId("ALL");
    setError(null);
    setActionSuccess(null);

    try {
      const records = students.map((st) => ({
        student_id: st.id,
        status: "hadir" as const,
      }));
      const res = await updateSessionAttendance(selectedSessionId, records);
      setActionSuccess(res.message || "All students marked present.");
      const updatedList = await fetchSessionAttendance(selectedSessionId).catch(() => []);
      setAttendances(updatedList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't update all records. Please try again.");
    } finally {
      setUpdatingStudentId(null);
    }
  };

  const currentSession = sessions.find((s) => s.id === selectedSessionId);

  // Map student attendance by student_id
  const attendanceMap = new Map<string, AttendanceItem>();
  attendances.forEach((a) => {
    attendanceMap.set(a.student_id, a);
  });

  // Calculate summary counts
  const summaryCounts = {
    total: students.length,
    hadir: attendances.filter((a) => a.status === "hadir").length,
    sakit: attendances.filter((a) => a.status === "sakit").length,
    izin: attendances.filter((a) => a.status === "izin").length,
    alfa: attendances.filter((a) => a.status === "alfa").length,
  };

  return (
    <div className="space-y-4">
      {/* Alert Notifications */}
      <div aria-live="polite" aria-atomic="true" className="space-y-2">
        {actionSuccess && (
          <div
            role="status"
            className="rounded-xl bg-slate-900 border border-slate-200 px-4 py-3 text-xs font-medium text-white flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccess(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-800 flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-600 hover:text-rose-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Select Course & Session Filter Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Course
            </label>
            {isLoadingCourses ? (
              <p className="text-xs text-slate-400 py-2">Loading courses...</p>
            ) : (
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Session
            </label>
            {isLoadingSessions ? (
              <p className="text-xs text-slate-400 py-2">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No sessions scheduled yet.</p>
            ) : (
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {sessions.map((s, idx) => (
                  <option key={s.id} value={s.id}>
                    Session #{idx + 1}: {s.title} ({s.attendance_status === "OPEN" ? "OPEN" : "CLOSED"})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Quiet Live Window Control Banner & Batch Actions */}
        {currentSession && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200/80 p-4">
            <div className="flex items-center gap-2.5">
              <span
              />

              <div>
                <p className="text-xs font-bold text-slate-900">
                  Attendance Window: {currentSession.attendance_status === "OPEN" ? "Open" : "Closed"}
                </p>
                <p className="text-[11px] text-slate-500">
                  {currentSession.attendance_status === "OPEN"
                    ? "Open for student check-ins."
                    : "Submissions closed for students. You can still adjust records below."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                disabled={updatingStudentId === "ALL" || students.length === 0}
                className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{updatingStudentId === "ALL" ? "Updating..." : "Mark all present"}</span>
              </button>

              {currentSession.attendance_status === "OPEN" ? (
                <button
                  type="button"
                  onClick={handleCloseAttendance}
                  disabled={isUpdatingSession}
                  className="rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isUpdatingSession ? "..." : "Close Window"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenAttendance}
                  disabled={isUpdatingSession}
                  className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{isUpdatingSession ? "..." : "Open Window"}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Attendance Breakdown Pills */}
        {selectedSessionId && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Total: {summaryCounts.total}
            </span>
            <span className="rounded-full bg-slate-100 border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-900">
              Hadir: {summaryCounts.hadir}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Sakit: {summaryCounts.sakit}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Izin: {summaryCounts.izin}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Alfa: {summaryCounts.alfa}
            </span>
          </div>
        )}
      </div>

      {/* Attendance Roster Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {!selectedSessionId ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Pick a session above to view and manage attendance.
          </div>
        ) : isLoadingAttendance ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading attendance...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No students enrolled in this course yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="sticky left-0 bg-slate-50 z-10 px-6 py-3 shadow-[1px_0_0_0_#e2e8f0]">
                    Student
                  </th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Update Status</th>
                  <th className="px-6 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const record = attendanceMap.get(student.id);
                  const status = record ? record.status : "Belum Absen";
                  const isUpdatingThis = updatingStudentId === student.id;

                  return (
                    <tr key={student.id} className="group hover:bg-slate-50 transition-colors duration-150">
                      <td className="sticky left-0 bg-white group-hover:bg-slate-50 z-10 px-6 py-3.5 font-semibold text-slate-900 shadow-[1px_0_0_0_#e2e8f0]">
                        {student.username}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">{student.email}</td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                            status === "hadir"
                              ? "bg-slate-100 text-slate-900 border border-slate-300"
                              : status === "Belum Absen"
                              ? "bg-slate-100 text-slate-500"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1">
                          {(["hadir", "sakit", "izin", "alfa"] as const).map((stOption) => {
                            const isCurrent = status === stOption;
                            return (
                              <button
                                key={stOption}
                                type="button"
                                onClick={() => handleUpdateStudentStatus(student.id, stOption)}
                                disabled={isUpdatingThis}
                                className={`px-2.5 py-1 text-[10px] font-semibold capitalize rounded-full transition-all ${
                                  isCurrent
                                    ? "bg-slate-900 text-white shadow-xs"
                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                } disabled:opacity-50`}
                              >
                                {stOption}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right text-slate-500 text-[11px]">
                        {record?.created_at
                          ? new Date(record.created_at).toLocaleString("id-ID")
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
