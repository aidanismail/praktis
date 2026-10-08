export const SESSION_EXPORT_FORMATS = ["csv", "xlsx"] as const;

export type SessionExportFormat = (typeof SESSION_EXPORT_FORMATS)[number];

export type SessionExportDownload = {
  blob: Blob;
  filename: string;
};
