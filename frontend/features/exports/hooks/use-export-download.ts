"use client";

import { useCallback, useState } from "react";
import type { SessionExportDownload } from "../types/export.type";

/**
 * Runs a fetch-based export and saves the resulting file, tracking which
 * export is running and the last error so it can be shown inline.
 */
export function useExportDownload() {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (key: string, download: () => Promise<SessionExportDownload>) => {
      setBusyKey(key);
      setError(null);
      try {
        const { blob, filename } = await download();
        const objectUrl = URL.createObjectURL(blob);
        try {
          const anchor = document.createElement("a");
          anchor.href = objectUrl;
          anchor.download = filename;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error && err.message
            ? err.message
            : "The export could not be downloaded."
        );
      } finally {
        setBusyKey(null);
      }
    },
    []
  );

  return { busyKey, error, clearError: () => setError(null), run };
}
