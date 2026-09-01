"use client";

import {
  CalendarClock,
  Download,
  FileText,
  Globe,
  Lock
} from "lucide-react";
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

export function ModuleCard({ userId, courseId, module, accessMode }: ModuleCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span
            className={
              module.is_published
                ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                : "inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"
            }
          >
            {module.is_published ? (
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            )}

            {accessMode === "read-only" ? "Available" : module.is_published ? "Published" : "Draft"}
          </span>

          <h3 className="mt-3 wrap-break-word text-lg font-semibold text-slate-950">
            {module.title}
          </h3>
        </div>

        <div
          className="flex h-11 w-11 shrink-0 items-center
              justify-center rounded-2xl bg-slate-100
              text-slate-700"
        >
          <FileText className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      {module.description ? (
        <p
          className="mt-4 whitespace-pre-wrap wrap-break-word
              text-sm leading-7 text-slate-700"
        >
          {module.description}
        </p>
      ) : (
        <p className="mt-4 text-sm italic text-slate-500">
          No description provided.
        </p>
      )}

      <div
        className="mt-5 flex flex-wrap items-center
            justify-between gap-4 border-t border-slate-100
            pt-4"
      >
        <span className="inline-flex items-center gap-2 text-xs text-slate-500">
          <CalendarClock className="h-4 w-4" aria-hidden="true" />
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
          className="inline-flex min-h-11 items-center gap-2
              rounded-xl px-3 text-sm font-semibold
              text-emerald-700 transition hover:bg-emerald-50
              hover:text-emerald-800 focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-emerald-700"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Open module
        </a>
      </div>

      {accessMode === "manage" ? <ModuleManagementControls userId={userId} courseId={courseId} module={module} /> : null}
    </article>
  );
}
