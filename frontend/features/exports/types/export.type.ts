export const SESSION_EXPORT_KINDS = ["attendance", "grades"] as const;
export const SESSION_EXPORT_FORMATS = ["csv", "xlsx"] as const;

export type SessionExportKind = (typeof SESSION_EXPORT_KINDS)[number];
export type SessionExportFormat = (typeof SESSION_EXPORT_FORMATS)[number];

export type SessionExportDownload = {
  blob: Blob;
  filename: string;
};
