"use client";

import type { CourseModule } from "../types/module.type";
import { ModuleManagementControls } from "./module-management-controls";

type ModuleCardProps = {
  userId: string;
  courseId: string;
  module: CourseModule;
  accessMode: "manage" | "read-only";
};

const moduleDateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short"
});

function formatModuleDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : moduleDateFormatter.format(date);
}

function getFileTypeBadge(fileKey?: string | null, downloadUrl?: string | null) {
  const ref = (fileKey ?? downloadUrl ?? "").toLowerCase();
  if (ref.includes(".pdf")) return "PDF";
  if (ref.includes(".docx")) return "DOCX";
  return "DOC";
}

export function ModuleCard({ userId, courseId, module, accessMode }: ModuleCardProps) {
  const fileType = getFileTypeBadge(module.file_key, module.download_url);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={
                module.is_published
                  ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"
                  : "inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600"
              }
            >
              {accessMode === "read-only" ? "Available" : module.is_published ? "Published" : "Draft"}
            </span>

            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              {fileType}
            </span>
          </div>

          <h3 className="mt-2.5 wrap-break-word text-base font-bold text-slate-950">
            {module.title}
          </h3>
        </div>
      </div>

      {module.description ? (
        <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-600">
          {module.description}
        </p>
      ) : (
        <p className="mt-3 text-xs italic text-slate-400">
          No description provided.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-500">
          Added{" "}
          <time dateTime={module.created_at}>
            {formatModuleDate(module.created_at)}
          </time>
        </span>

        <a
          href={module.download_url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${module.title} in a new tab`}
          className="inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Open file
        </a>
      </div>

      {accessMode === "manage" ? (
        <ModuleManagementControls userId={userId} courseId={courseId} module={module} />
      ) : null}
    </article>
  );
}
