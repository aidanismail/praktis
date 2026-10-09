"use client";

import { useState } from "react";
import { DocumentPreviewModal } from "@/components/ui/document-preview-modal";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { formatDateTime } from "@/lib/format/date";
import { formatScore } from "@/lib/format/score";
import type { AssignmentSubmission } from "../types/assignment.type";
import {
  DownloadSimpleIcon,
  EyeIcon,
  FileTextIcon,
  ChatTextIcon
} from "@phosphor-icons/react";

type PraktikanSubmissionSummaryProps = {
  submission: AssignmentSubmission | null;
  maxPoints?: number;
  gradesPublished?: boolean;
};

function formatFileSize(value: number) {
  if (!Number.isFinite(value) || value < 0) return "Size unavailable";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function PraktikanSubmissionSummary({
  submission,
  maxPoints,
  gradesPublished = false,
}: PraktikanSubmissionSummaryProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  if (!submission) {
    return (
      <section
        aria-labelledby="my-submission-heading"
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs"
      >
        <h2 id="my-submission-heading" className="text-lg font-bold text-slate-950">
          Your Submission
        </h2>
        <div
          role="status"
          className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center"
        >
          <FileTextIcon className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <p className="mt-3 text-xs font-bold text-slate-900">Nothing turned in yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Ready? Choose your file below to turn in your work.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="my-submission-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Work</p>
          <h2 id="my-submission-heading" className="mt-1 text-base font-bold tracking-tight text-slate-950">
            Your submission
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`font-semibold ${
              submission.is_late
                ? "text-rose-700"
                : "text-slate-500"
            }`}
          >
            {submission.is_late ? "Late" : "On time"}
          </span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span className="font-semibold text-slate-900 capitalize">
            {submission.status.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Clean Typographic Key-Value List */}
      <dl className="mt-4 divide-y divide-slate-100 text-xs">
        <div className="flex items-start justify-between py-2.5 gap-3">
          <dt className="text-slate-400 font-medium">File</dt>
          <dd className="text-right min-w-0 break-all">
            <span
              title={submission.file_name}
              className="font-semibold text-slate-900 block break-all"
            >
              {submission.file_name}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {formatFileSize(submission.file_size)}
            </span>
          </dd>
        </div>

        <div className="flex items-center justify-between py-2.5 gap-3">
          <dt className="text-slate-400 font-medium">Submitted</dt>
          <dd className="font-semibold text-slate-900">
            <time dateTime={submission.submitted_at}>
              {formatDateTime(submission.submitted_at)}
            </time>
          </dd>
        </div>

        <div className="flex items-center justify-between py-2.5 gap-3">
          <dt className="text-slate-400 font-medium">Score</dt>
          <dd className="font-semibold text-slate-900">
            {submission.score === null ? (
              <span className="text-slate-400 font-normal">
                {gradesPublished ? "Awaiting grade" : "Grades not released yet"}
              </span>
            ) : (
              <span className="text-emerald-700 font-bold font-mono">
                {formatScore(submission.score)}
                {maxPoints ? (
                  <span className="text-xs font-normal text-slate-400"> / {maxPoints}</span>
                ) : null}
              </span>
            )}
          </dd>
        </div>

        {submission.graded_at && (
          <div className="flex items-center justify-between py-2.5 gap-3">
            <dt className="text-slate-400 font-medium">Graded</dt>
            <dd className="text-slate-600 font-medium">
              <time dateTime={submission.graded_at}>
                {formatDateTime(submission.graded_at)}
              </time>
            </dd>
          </div>
        )}
      </dl>

      {submission.feedback ? (
        <div className="mt-4 border-l-2 border-slate-900 pl-3.5 py-1">
          <p className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            <ChatTextIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            Instructor Feedback
          </p>
          <p className="mt-1.5 whitespace-pre-wrap wrap-break-word text-xs leading-relaxed text-slate-700">
            {submission.feedback}
          </p>
        </div>
      ) : null}

      <div className="mt-5">
        {submission.download_url ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <EyeIcon className="h-4 w-4" aria-hidden="true" />
              Preview
            </button>
            <a
              href={submission.download_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
            >
              <DownloadSimpleIcon className="h-4 w-4" aria-hidden="true" />
              Download submitted file
            </a>
            <DocumentPreviewModal
              isOpen={isPreviewOpen}
              title={submission.file_name}
              fileUrl={submission.download_url}
              fileExtension={submission.file_name.split(".").pop() || "pdf"}
              onClose={() => setIsPreviewOpen(false)}
            />
          </div>
        ) : (
          <NotificationBanner
            variant="warning"
            message="Your file is safely stored, but the download link is taking a moment. Refresh in a bit."
          />
        )}
      </div>
    </section>
  );
}
