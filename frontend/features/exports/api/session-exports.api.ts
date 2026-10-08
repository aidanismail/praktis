import { ApiError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  SessionExportDownload,
  SessionExportFormat
} from "../types/export.type";

function getExportErrorMessage(status: number) {
  if (status === 401) return "Your session expired. Sign in again.";
  if (status === 403) return "You are not allowed to export this session.";
  if (status === 404) return "Nothing to export yet.";
  if (status === 422) return "The export format or session link is invalid.";

  return "The export could not be prepared.";
}

function buildSafeFilename(sessionId: string, format: SessionExportFormat) {
  const safeSessionId = sessionId.replace(/[^a-zA-Z0-9-]/g, "") || "session";
  return `attendance_${safeSessionId}.${format}`;
}

export async function downloadSessionAttendanceExport(
  sessionId: string,
  format: SessionExportFormat
): Promise<SessionExportDownload> {
  const response = await fetch(API_ENDPOINTS.export.attendance(sessionId, format), {
    method: "GET",
    credentials: "include",
    cache: "no-store"
  });

  if (!response.ok) {
    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");
    const data = isJson ? await response.json().catch(() => null) : null;
    throw new ApiError(
      getExportErrorMessage(response.status),
      response.status,
      data
    );
  }

  return {
    blob: await response.blob(),
    filename: buildSafeFilename(sessionId, format)
  };
}
