"use client";

import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCourseRoster } from "@/features/courses/hooks/use-course-roster";
import { useSessionAttendance } from "@/features/attendance/hooks/use-session-attendance";
import { useSessionGrades } from "@/features/grades/hooks/use-session-grades";
import type { CourseSession } from "@/features/sessions/types/session.type";
import { ApiError } from "@/lib/api/client";
import { downloadSessionExport } from "../api/session-exports.api";
import type {
  SessionExportFormat,
  SessionExportKind
} from "../types/export.type";

type SessionExportPanelProps = {
  userId: string;
  courseId: string;
  session: CourseSession;
};

type ActiveDownload = {
  kind: SessionExportKind;
  format: SessionExportFormat;
};

function getDownloadError(error: Error | null) {
  if (!error) return null;

  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session expired. Sign in again before downloading.";
    if (error.status === 403) return "You are not allowed to export records for this course.";
    if (error.status === 404) return "No saved rows were found. Refresh the session data before retrying.";
    if (error.status === 422) return "The requested export format or session link is invalid.";
  }

  return "The export could not be downloaded because of a network or server problem.";
}

function ExportButtons({
  kind,
  disabled,
  activeDownload,
  onDownload
}: {
  kind: SessionExportKind;
  disabled: boolean;
  activeDownload: ActiveDownload | null;
  onDownload: (kind: SessionExportKind, format: SessionExportFormat) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label={`${kind} export formats`}>
      {(["csv", "xlsx"] as const).map((format) => {
        const active = activeDownload?.kind === kind && activeDownload.format === format;

        return (
          <button
            key={format}
            type="button"
            onClick={() => onDownload(kind, format)}
            disabled={disabled || activeDownload !== null}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold uppercase text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {active ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
            {active ? `Preparing ${format}` : format}
          </button>
        );
      })}
    </div>
  );
}

export function SessionExportPanel({
  userId,
  courseId,
  session
}: SessionExportPanelProps) {
  const activeObjectUrl = useRef<string | null>(null);
  const [activeDownload, setActiveDownload] = useState<ActiveDownload | null>(null);
  const [downloadError, setDownloadError] = useState<Error | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const rosterQuery = useCourseRoster({ userId, courseId, enabled: true });
  const attendanceQuery = useSessionAttendance({
    userId,
    courseId,
    sessionId: session.id,
    enabled: true
  });
  const gradesQuery = useSessionGrades({
    userId,
    courseId,
    sessionId: session.id,
    enabled: true
  });
  const rosterCount = rosterQuery.data?.length;
  const attendanceCount = attendanceQuery.data?.length ?? 0;
  const gradeCount = gradesQuery.data?.length ?? 0;
  const errorMessage = getDownloadError(downloadError);

  useEffect(() => {
    return () => {
      if (activeObjectUrl.current) {
        URL.revokeObjectURL(activeObjectUrl.current);
      }
    };
  }, []);

  async function startDownload(
    kind: SessionExportKind,
    format: SessionExportFormat
  ) {
    setActiveDownload({ kind, format });
    setDownloadError(null);
    setSuccessMessage(null);

    try {
      const download = await downloadSessionExport(kind, session.id, format);
      const objectUrl = URL.createObjectURL(download.blob);
      activeObjectUrl.current = objectUrl;

      try {
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = download.filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setSuccessMessage(
          `${kind === "attendance" ? "Attendance" : "Grade"} ${format.toUpperCase()} download started.`
        );
      } finally {
        URL.revokeObjectURL(objectUrl);
        activeObjectUrl.current = null;
      }
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error : new Error("Export download failed")
      );
    } finally {
      setActiveDownload(null);
    }
  }

  return (
    <section aria-labelledby="session-exports-heading" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
          <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="session-exports-heading" className="text-xl font-semibold text-slate-950">Session exports</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Download saved academic rows for this verified session only.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 p-4 sm:p-5">
          <h3 className="font-semibold text-slate-950">Attendance records</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Contains saved attendance rows only; unrecorded roster members are omitted.
          </p>
          <p className="mt-3 text-sm font-medium text-slate-700">
            {attendanceQuery.data === undefined
              ? "Attendance count unavailable"
              : rosterCount === undefined
                ? `${attendanceCount} saved rows; roster count unavailable`
                : `${attendanceCount} recorded of ${rosterCount} enrolled`}
          </p>
          <div className="mt-4">
            <ExportButtons
              kind="attendance"
              disabled={attendanceQuery.data === undefined || attendanceCount === 0}
              activeDownload={activeDownload}
              onDownload={startDownload}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 p-4 sm:p-5">
          <h3 className="font-semibold text-slate-950">
            {session.grades_published ? "Published grade records" : "Draft grade records"}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Contains saved grade rows only. {session.grades_published ? "These saved results are currently published to their Praktikan owners." : "These records are staff-only drafts and are not currently visible to Praktikan."}
          </p>
          <p className="mt-3 text-sm font-medium text-slate-700">
            {gradesQuery.data === undefined
              ? "Grade count unavailable"
              : rosterCount === undefined
                ? `${gradeCount} saved rows; roster count unavailable`
                : `${gradeCount} graded of ${rosterCount} enrolled`}
          </p>
          <div className="mt-4">
            <ExportButtons
              kind="grades"
              disabled={gradesQuery.data === undefined || gradeCount === 0}
              activeDownload={activeDownload}
              onDownload={startDownload}
            />
          </div>
        </article>
      </div>

      {rosterQuery.isError || attendanceQuery.isError || gradesQuery.isError ? (
        <p role="alert" className="mt-4 inline-flex items-start gap-2 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          One or more row counts could not be loaded. Unavailable export controls remain disabled.
        </p>
      ) : null}

      {errorMessage ? (
        <p role="alert" className="mt-4 inline-flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p role="status" aria-live="polite" className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {successMessage}
        </p>
      ) : null}
    </section>
  );
}
