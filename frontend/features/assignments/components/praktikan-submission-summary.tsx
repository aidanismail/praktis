import { NotificationBanner } from "@/components/ui/notification-banner";
import type { AssignmentSubmission } from "../types/assignment.type";
import {
  DownloadSimple,
  FileText,
  ChatText
} from "@phosphor-icons/react";

type PraktikanSubmissionSummaryProps = {
  submission: AssignmentSubmission | null;
  maxPoints?: number;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : dateFormatter.format(date);
}

function formatFileSize(value: number) {
  if (!Number.isFinite(value) || value < 0) return "Size unavailable";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function PraktikanSubmissionSummary({
  submission,
}: PraktikanSubmissionSummaryProps) {
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
          <FileText className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <p className="mt-3 text-xs font-bold text-slate-900">Nothing turned in yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Ready? Drop your file or browse below to turn in your work.
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

      {/* Clean Typographic Key-Value List (No Card Boxes, No Max Points) */}
      <dl className="mt-4 divide-y divide-slate-100 text-xs">
        <div className="flex items-start justify-between py-2.5 gap-3">
          <dt className="text-slate-400 font-medium">File</dt>
          <dd className="text-right min-w-0">
            <span className="font-semibold text-slate-900 block truncate max-w-[200px]">
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
              {formatDate(submission.submitted_at)}
            </time>
          </dd>
        </div>

        <div className="flex items-center justify-between py-2.5 gap-3">
          <dt className="text-slate-400 font-medium">Score</dt>
          <dd className="font-semibold text-slate-900">
            {submission.score === null ? (
              <span className="text-slate-400 font-normal">Pending review</span>
            ) : (
              <span className="text-emerald-700 font-bold font-mono">{submission.score}</span>
            )}
          </dd>
        </div>

        {submission.graded_at && (
          <div className="flex items-center justify-between py-2.5 gap-3">
            <dt className="text-slate-400 font-medium">Graded</dt>
            <dd className="text-slate-600 font-medium">
              <time dateTime={submission.graded_at}>
                {formatDate(submission.graded_at)}
              </time>
            </dd>
          </div>
        )}
      </dl>

      {submission.feedback ? (
        <div className="mt-4 border-l-2 border-slate-900 pl-3.5 py-1">
          <p className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            <ChatText className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            Instructor Feedback
          </p>
          <p className="mt-1.5 whitespace-pre-wrap wrap-break-word text-xs leading-relaxed text-slate-700">
            {submission.feedback}
          </p>
        </div>
      ) : null}

      <div className="mt-5">
        {submission.download_url ? (
          <a
            href={submission.download_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <DownloadSimple className="h-4 w-4" aria-hidden="true" />
            Download submitted file
          </a>
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
