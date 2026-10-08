"use client";

import { useEffect, useState } from "react";
import {
  fetchAdminCourses,
  fetchAssignments,
  fetchCourseSessions,
  getAssignmentGradeExportUrl,
  getAttendanceExportUrl,
  type AssignmentItem,
} from "../api/admin.api";
import type { Course } from "@/features/courses/types/course.type";
import type { ClassSessionItem } from "../types/admin.type";

type ExportType = "grades" | "attendance";

const SELECT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900";
const LABEL_CLASS = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5";

export function GradeExportsView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<ClassSessionItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [exportType, setExportType] = useState<ExportType>("grades");
  const [fileFormat, setFileFormat] = useState<"csv" | "xlsx">("csv");

  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);

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

    async function loadTargets() {
      setIsLoadingTargets(true);
      try {
        const [sList, aList] = await Promise.all([
          fetchCourseSessions(selectedCourseId).catch(() => []),
          fetchAssignments(selectedCourseId).catch(() => []),
        ]);
        if (isMounted) {
          setSessions(sList);
          setAssignments(aList);
          setSelectedSessionId(sList[0]?.id ?? "");
          setSelectedAssignmentId(aList[0]?.id ?? "");
        }
      } finally {
        if (isMounted) {
          setIsLoadingTargets(false);
        }
      }
    }
    loadTargets();
    return () => {
      isMounted = false;
    };
  }, [selectedCourseId]);

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
                onChange={(e) => setSelectedCourseId(e.target.value)}
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
              ) : exportType === "grades" ? (
                assignments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No assignments in this course yet.</p>
                ) : (
                  <select
                    id="export-target"
                    value={selectedAssignmentId}
                    onChange={(e) => setSelectedAssignmentId(e.target.value)}
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
                  onChange={(e) => setSelectedSessionId(e.target.value)}
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
                className="rounded-full bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.98]"
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
