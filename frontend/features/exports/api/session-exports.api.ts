import { ApiError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  SessionExportDownload,
  SessionExportFormat,
  SessionExportKind
} from "../types/export.type";

function getExportErrorMessage(status: number) {
  if (status === 401) return "Your session expired. Sign in again.";
  if (status === 403) return "You are not allowed to export this session.";
  if (status === 404) return "No saved records are available for this export.";
  if (status === 422) return "The export format or session link is invalid.";

  return "The export could not be prepared.";
}

function buildSafeFilename(
  kind: SessionExportKind,
  sessionId: string,
  format: SessionExportFormat
) {
  const safeSessionId = sessionId.replace(/[^a-zA-Z0-9-]/g, "") || "session";
  return `${kind}_${safeSessionId}.${format}`;
}

export async function downloadSessionExport(
  kind: SessionExportKind,
  sessionId: string,
  format: SessionExportFormat
): Promise<SessionExportDownload> {
  const endpoint =
    kind === "attendance"
      ? API_ENDPOINTS.export.attendance(sessionId, format)
      : API_ENDPOINTS.export.grades(sessionId, format);
  const response = await fetch(endpoint, {
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
    filename: buildSafeFilename(kind, sessionId, format)
  };
}
