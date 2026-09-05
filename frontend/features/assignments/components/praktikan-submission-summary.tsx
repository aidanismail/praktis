import { Download, FileText, MessageSquareText } from "lucide-react";
import type { AssignmentSubmission } from "../types/assignment.type";

type PraktikanSubmissionSummaryProps = { submission: AssignmentSubmission | null; maxPoints: number };

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : dateFormatter.format(date);
}

function formatFileSize(value: number) {
  if (!Number.isFinite(value) || value < 0) return "Size unavailable";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function PraktikanSubmissionSummary({ submission, maxPoints }: PraktikanSubmissionSummaryProps) {
  if (!submission) {
    return (
      <section aria-labelledby="my-submission-heading" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 id="my-submission-heading" className="text-lg font-semibold text-slate-950">Your submission</h2>
        <div role="status" className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <p className="mt-3 font-semibold text-slate-900">Nothing turned in yet</p>
          <p className="mt-1 text-sm text-slate-600">Ready? Drop your file or browse below to turn in your work.</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="my-submission-heading" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Your work</p>
          <h2 id="my-submission-heading" className="mt-1 text-lg font-semibold text-slate-950">Your submission</h2>
        </div>
        <div className="flex gap-2">
          <span className={submission.is_late ? "rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700" : "rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700"}>
            {submission.is_late ? "Late" : "On time"}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {submission.status}
          </span>
        </div>
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">File</dt>
          <dd className="mt-2 wrap-break-word text-sm font-medium text-slate-950">{submission.file_name}</dd>
          <dd className="mt-1 text-xs text-slate-500">{formatFileSize(submission.file_size)}</dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted</dt>
          <dd className="mt-2 text-sm font-medium text-slate-950">
            <time dateTime={submission.submitted_at}>{formatDate(submission.submitted_at)}</time>
          </dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</dt>
          <dd className="mt-2 text-sm font-semibold text-slate-950">
            {submission.score === null ? "Grading in progress" : `${submission.score} / ${maxPoints}`}
          </dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Graded</dt>
          <dd className="mt-2 text-sm font-medium text-slate-950">
            {submission.graded_at ? <time dateTime={submission.graded_at}>{formatDate(submission.graded_at)}</time> : "Pending review"}
          </dd>
        </div>
      </dl>
      {submission.feedback ? (
        <div className="mt-4 rounded-2xl border border-slate-200 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <MessageSquareText className="h-4 w-4" aria-hidden="true" />Feedback from assistant
          </p>
          <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-700">{submission.feedback}</p>
        </div>
      ) : null}
      {submission.download_url ? (
        <a
          href={submission.download_url}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
        >
          <Download className="h-4 w-4" aria-hidden="true" />Download submitted file
        </a>
      ) : (
        <p role="status" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          Your file is safely stored, but the download link is taking a moment. Refresh in a bit.
        </p>
      )}
    </section>
  );
}
