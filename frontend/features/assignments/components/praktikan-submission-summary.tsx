import { Download, FileText, MessageSquareText } from "lucide-react";
import { NotificationBanner } from "@/components/ui/notification-banner";
import type { AssignmentSubmission } from "../types/assignment.type";

type PraktikanSubmissionSummaryProps = {
  submission: AssignmentSubmission | null;
  maxPoints: number;
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
  maxPoints,
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
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Work</p>
          <h2 id="my-submission-heading" className="mt-1 text-lg font-bold text-slate-950">
            Your Submission
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
              submission.is_late
                ? "border-red-200/60 bg-red-50/80 text-red-700"
                : "border-emerald-200/60 bg-emerald-50/80 text-emerald-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                submission.is_late ? "bg-red-500" : "bg-emerald-500"
              }`}
            />
            <span>{submission.is_late ? "Late" : "On time"}</span>
          </span>
          <span className="rounded-full bg-slate-100 border border-slate-200/60 px-3 py-1 text-xs font-semibold text-slate-600">
            {submission.status}
          </span>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/60 bg-slate-50 p-4">
          <dt className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">File</dt>
          <dd className="mt-1 wrap-break-word text-xs font-bold text-slate-950">
            {submission.file_name}
          </dd>
          <dd className="mt-0.5 text-[11px] text-slate-500">
            {formatFileSize(submission.file_size)}
          </dd>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-slate-50 p-4">
          <dt className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Submitted</dt>
          <dd className="mt-1 text-xs font-bold text-slate-950">
            <time dateTime={submission.submitted_at}>
              {formatDate(submission.submitted_at)}
            </time>
          </dd>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-slate-50 p-4">
          <dt className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Score</dt>
          <dd className="mt-1 text-xs font-bold text-slate-950">
            {submission.score === null
              ? "Grading in progress"
              : `${submission.score} / ${maxPoints}`}
          </dd>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-slate-50 p-4">
          <dt className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Graded</dt>
          <dd className="mt-1 text-xs font-bold text-slate-950">
            {submission.graded_at ? (
              <time dateTime={submission.graded_at}>
                {formatDate(submission.graded_at)}
              </time>
            ) : (
              "Pending review"
            )}
          </dd>
        </div>
      </dl>

      {submission.feedback ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="flex items-center gap-2 text-[10px] uppercase font-semibold tracking-wider text-slate-400">
            <MessageSquareText className="h-4 w-4 text-slate-400" aria-hidden="true" />
            Feedback from Assistant
          </p>
          <p className="mt-2 whitespace-pre-wrap wrap-break-word text-xs leading-6 text-slate-700">
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
            <Download className="h-4 w-4" aria-hidden="true" />
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
