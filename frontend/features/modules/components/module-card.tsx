"use client";

import { Download } from "lucide-react";
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
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className={module.is_published ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
              {accessMode === "read-only" ? "Available" : module.is_published ? "Published" : "Draft"}
            </span>
            <span>·</span>
            <time dateTime={module.created_at}>
              {formatModuleDate(module.created_at)}
            </time>
          </div>

          <h3 className="mt-1.5 wrap-break-word text-base font-semibold text-slate-950">
            {module.title}
          </h3>
        </div>

        <a
          href={module.download_url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${module.title} in a new tab`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:underline"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Open module
        </a>
      </div>

      {module.description ? (
        <p className="mt-2.5 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-600">
          {module.description}
        </p>
      ) : null}

      {accessMode === "manage" ? (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <ModuleManagementControls userId={userId} courseId={courseId} module={module} />
        </div>
      ) : null}
    </article>
  );
}
