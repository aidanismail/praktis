"use client";

import { useEffect, useState } from "react";
import {
  fetchAdminCourses,
  fetchCourseSessions,
  getGradeExportUrl,
  getAttendanceExportUrl,
} from "../api/admin.api";
import type { Course } from "@/features/courses/types/course.type";
import type { ClassSessionItem } from "../types/admin.type";

export function GradeExportsView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<ClassSessionItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [exportType, setExportType] = useState<"grades" | "attendance">("grades");
  const [fileFormat, setFileFormat] = useState<"csv" | "xlsx">("csv");

  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

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

    async function loadSessions() {
      setIsLoadingSessions(true);
      try {
        const sList = await fetchCourseSessions(selectedCourseId).catch(() => []);
        if (isMounted) {
          setSessions(sList);
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
    loadSessions();
    return () => {
      isMounted = false;
    };
  }, [selectedCourseId]);

  const handleDownload = () => {
    if (!selectedSessionId) return;

    let url = "";
    if (exportType === "grades") {
      url = getGradeExportUrl(selectedSessionId, fileFormat);
    } else {
      url = getAttendanceExportUrl(selectedSessionId, fileFormat);
    }

    window.open(url, "_blank");
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        {isLoadingCourses ? (
          <p className="text-xs text-slate-400 py-4">Loading catalog courses...</p>
        ) : courses.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No practicum courses available for data export.</p>
        ) : (
          <div className="space-y-4">
            {/* Step 1: Course */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                1. Practicum Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} ({c.academic_year} {c.semester})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Session */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                2. Class Session
              </label>
              {isLoadingSessions ? (
                <p className="text-xs text-slate-400 py-2">Loading sessions...</p>
              ) : sessions.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No class sessions recorded for this course.</p>
              ) : (
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {sessions.map((s, idx) => (
                    <option key={s.id} value={s.id}>
                      Session #{idx + 1}: {s.title} ({s.attendance_status})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Step 3: Export Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                3. Dataset Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportType("grades")}
                  className={`rounded-xl border p-3 text-left text-xs transition-all ${
                    exportType === "grades"
                      ? "border-slate-900 bg-slate-50 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="font-bold text-slate-900 block">Session Grades</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Export student scores, feedback, and grader info.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportType("attendance")}
                  className={`rounded-xl border p-3 text-left text-xs transition-all ${
                    exportType === "attendance"
                      ? "border-slate-900 bg-slate-50 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="font-bold text-slate-900 block">Attendance Log</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Export check-in timestamps and status (Hadir/Sakit/Izin/Alfa).
                  </span>
                </button>
              </div>
            </div>

            {/* Step 4: File Format */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                4. File Format
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFileFormat("csv")}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    fileFormat === "csv"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  .CSV (Comma Separated)
                </button>
                <button
                  type="button"
                  onClick={() => setFileFormat("xlsx")}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    fileFormat === "xlsx"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  .XLSX (Microsoft Excel)
                </button>
              </div>
            </div>

            {/* Action Download */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                {selectedCourse && selectedSession ? (
                  <span>Target: {selectedCourse.code} • {selectedSession.title}</span>
                ) : (
                  <span>Select course & session to download.</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!selectedSessionId}
                className="rounded-full bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                Export Dataset ({fileFormat.toUpperCase()})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
