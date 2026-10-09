"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAdminCourses,
  fetchAssignments,
  fetchCourseSessions,
  getAssignmentGradeExportUrl,
  getAttendanceExportUrl,
} from "../api/admin.api";
import { adminQueryKeys } from "../constants/admin-query-keys";
import { NotificationBanner } from "@/components/ui/notification-banner";

type ExportType = "grades" | "attendance";

const SELECT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900";
const LABEL_CLASS = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5";

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

export function GradeExportsView() {
  const [pickedCourseId, setPickedCourseId] = useState<string>("");
  const [pickedSessionId, setPickedSessionId] = useState<string>("");
  const [pickedAssignmentId, setPickedAssignmentId] = useState<string>("");
  const [exportType, setExportType] = useState<ExportType>("grades");
  const [fileFormat, setFileFormat] = useState<"csv" | "xlsx">("csv");

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
  const assignmentsQuery = useQuery({
    queryKey: adminQueryKeys.courseAssignments(selectedCourseId),
    queryFn: () => fetchAssignments(selectedCourseId),
    enabled: Boolean(selectedCourseId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const sessions = sessionsQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];
  const selectedSessionId = sessions.some((s) => s.id === pickedSessionId)
    ? pickedSessionId
    : (sessions[0]?.id ?? "");
  const selectedAssignmentId = assignments.some((a) => a.id === pickedAssignmentId)
    ? pickedAssignmentId
    : (assignments[0]?.id ?? "");

  const isLoadingCourses = coursesQuery.isLoading;
  const isLoadingTargets =
    exportType === "grades" ? assignmentsQuery.isLoading : sessionsQuery.isLoading;
  const targetsQuery = exportType === "grades" ? assignmentsQuery : sessionsQuery;

  const targetId = exportType === "grades" ? selectedAssignmentId : selectedSessionId;

  const handleDownload = () => {
    if (!targetId) return;
    const url =
      exportType === "grades"
        ? getAssignmentGradeExportUrl(targetId, fileFormat)
        : getAttendanceExportUrl(targetId, fileFormat);
    window.open(url, "_blank");
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const targetTitle =
    exportType === "grades"
      ? assignments.find((a) => a.id === selectedAssignmentId)?.title
      : sessions.find((s) => s.id === selectedSessionId)?.title;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        {isLoadingCourses ? (
          <p className="text-xs text-slate-400 py-4">Loading courses...</p>
        ) : coursesQuery.isError ? (
          <QueryError
            message="Couldn't load courses."
            onRetry={() => void coursesQuery.refetch()}
          />
        ) : courses.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No courses available to export.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="export-course" className={LABEL_CLASS}>
                Course
              </label>
              <select
                id="export-course"
                value={selectedCourseId}
                onChange={(e) => setPickedCourseId(e.target.value)}
                className={SELECT_CLASS}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} ({c.academic_year} {c.semester})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className={LABEL_CLASS}>Data to Export</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportType("grades")}
                  aria-pressed={exportType === "grades"}
                  className={`rounded-xl border p-3 text-left text-xs transition-all ${
                    exportType === "grades"
                      ? "border-slate-900 bg-slate-50 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="font-bold text-slate-900 block">Assignment grades</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Scores, late flags, and feedback for one assignment.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportType("attendance")}
                  aria-pressed={exportType === "attendance"}
                  className={`rounded-xl border p-3 text-left text-xs transition-all ${
                    exportType === "attendance"
                      ? "border-slate-900 bg-slate-50 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="font-bold text-slate-900 block">Session attendance</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Hadir, sakit, izin, and alfa for one session.
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="export-target" className={LABEL_CLASS}>
                {exportType === "grades" ? "Assignment" : "Session"}
              </label>
              {isLoadingTargets ? (
                <p className="text-xs text-slate-400 py-2">Loading...</p>
              ) : targetsQuery.isError ? (
                <QueryError
                  message={`Couldn't load ${exportType === "grades" ? "assignments" : "sessions"}.`}
                  onRetry={() => void targetsQuery.refetch()}
                />
              ) : exportType === "grades" ? (
                assignments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No assignments in this course yet.</p>
                ) : (
                  <select
                    id="export-target"
                    value={selectedAssignmentId}
                    onChange={(e) => setPickedAssignmentId(e.target.value)}
                    className={SELECT_CLASS}
                  >
                    {assignments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} ({a.max_points} pts)
                      </option>
                    ))}
                  </select>
                )
              ) : sessions.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No sessions recorded for this course.</p>
              ) : (
                <select
                  id="export-target"
                  value={selectedSessionId}
                  onChange={(e) => setPickedSessionId(e.target.value)}
                  className={SELECT_CLASS}
                >
                  {sessions.map((s, idx) => (
                    <option key={s.id} value={s.id}>
                      Session #{idx + 1}: {s.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <span className={LABEL_CLASS}>File Format</span>
              <div className="flex items-center gap-2">
                {(["csv", "xlsx"] as const).map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => setFileFormat(format)}
                    aria-pressed={fileFormat === format}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      fileFormat === format
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {format === "csv" ? "CSV (.csv)" : "Excel (.xlsx)"}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                {selectedCourse && targetTitle ? (
                  <span>Target: {selectedCourse.code} • {targetTitle}</span>
                ) : (
                  <span>
                    Select a course and {exportType === "grades" ? "assignment" : "session"} to export.
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!targetId}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                Download ({fileFormat.toUpperCase()})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
