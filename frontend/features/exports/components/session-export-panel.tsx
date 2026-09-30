"use client";

import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import { useEffect, useRef, useState } from "react";
import { useCourseRoster } from "@/features/courses/hooks/use-course-roster";
import { useSessionAttendance } from "@/features/attendance/hooks/use-session-attendance";
import type { CourseSession } from "@/features/sessions/types/session.type";
import { ApiError } from "@/lib/api/client";
import { downloadSessionExport } from "../api/session-exports.api";
import type { SessionExportFormat } from "../types/export.type";
import {
  WarningCircle,
  DownloadSimple
} from "@phosphor-icons/react";

type SessionExportPanelProps = {
  userId: string;
  courseId: string;
  session: CourseSession;
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

export function SessionExportPanel({
  userId,
  courseId,
  session
}: SessionExportPanelProps) {
  const activeObjectUrl = useRef<string | null>(null);
  const [activeFormat, setActiveFormat] = useState<SessionExportFormat | null>(null);
  const [downloadError, setDownloadError] = useState<Error | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const rosterQuery = useCourseRoster({ userId, courseId, enabled: true });
  const attendanceQuery = useSessionAttendance({
    userId,
    courseId,
    sessionId: session.id,
    enabled: true
  });
  const rosterCount = rosterQuery.data?.length;
  const attendanceCount = attendanceQuery.data?.length ?? 0;
  const errorMessage = getDownloadError(downloadError);

  useEffect(() => {
    return () => {
      if (activeObjectUrl.current) {
        URL.revokeObjectURL(activeObjectUrl.current);
      }
    };
  }, []);

  async function startDownload(format: SessionExportFormat) {
    setActiveFormat(format);
    setDownloadError(null);
    setSuccessMessage(null);

    try {
      const download = await downloadSessionExport("attendance", session.id, format);
      const objectUrl = URL.createObjectURL(download.blob);
      activeObjectUrl.current = objectUrl;

      try {
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = download.filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setSuccessMessage(`Attendance ${format.toUpperCase()} download started.`);
      } finally {
        URL.revokeObjectURL(objectUrl);
        activeObjectUrl.current = null;
      }
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error : new Error("Export download failed")
      );
    } finally {
      setActiveFormat(null);
    }
  }

  return (
    <section aria-label="Export records" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
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
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Attendance export formats">
          {(["csv", "xlsx"] as const).map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => startDownload(format)}
              disabled={attendanceQuery.data === undefined || attendanceCount === 0 || activeFormat !== null}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase text-slate-700 transition hover:bg-slate-50 apple-press focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {activeFormat === format ? <AsteriskLoader className="h-3.5 w-3.5" aria-hidden="true" /> : <DownloadSimple className="h-3.5 w-3.5" aria-hidden="true" />}
              {activeFormat === format ? `Preparing ${format}` : format}
            </button>
          ))}
        </div>
      </div>

      {(rosterQuery.isError || attendanceQuery.isError) ? (
        <p role="alert" className="mt-4 inline-flex items-start gap-2 text-sm text-amber-800">
          <WarningCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Row counts could not be loaded. Export controls remain disabled until data is available.
        </p>
      ) : null}

      {errorMessage ? (
        <p role="alert" className="mt-4 inline-flex items-start gap-2 text-sm text-red-700">
          <WarningCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p role="status" aria-live="polite" className="mt-4 text-xs font-semibold text-emerald-700">
          {successMessage}
        </p>
      ) : null}
    </section>
  );
}
