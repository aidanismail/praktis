"use client";

import { EyeIcon, EyeSlashIcon, MegaphoneIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { formatDateTime } from "@/lib/format/date";

type GradePublishBarProps = {
  published: boolean;
  publishedAt: string | null;
  pendingCount: number;
  gradedCount: number;
  isPending: boolean;
  errorMessage: string | null;
  onSetPublished: (published: boolean) => Promise<unknown>;
};

/** Publish/unpublish control shared by the asprak and admin grading screens. */
export function GradePublishBar({
  published,
  publishedAt,
  pendingCount,
  gradedCount,
  isPending,
  errorMessage,
  onSetPublished
}: GradePublishBarProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  function setPublished(next: boolean) {
    onSetPublished(next)
      .then(() => setIsConfirming(false))
      .catch(() => undefined);
  }

  function handlePublishClick() {
    if (pendingCount > 0) {
      setIsConfirming(true);
    } else {
      setPublished(true);
    }
  }

  const publishedLabel = publishedAt ? formatDateTime(publishedAt, "") || null : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {published ? (
              <EyeIcon className="h-4 w-4" aria-hidden="true" />
            ) : (
              <EyeSlashIcon className="h-4 w-4" aria-hidden="true" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">
              {published ? "Grades published" : "Grades not published"}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {published
                ? `Praktikan can see their scores and feedback${
                    publishedLabel ? ` (since ${publishedLabel})` : ""
                  }. Grade changes are visible immediately.`
                : "Scores and feedback stay private until you publish them."}
            </p>
          </div>
        </div>

        {published ? (
          <button
            type="button"
            onClick={() => setPublished(false)}
            disabled={isPending}
            className="apple-press shrink-0 self-end sm:self-auto inline-flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs shadow-xs transition-colors disabled:opacity-60"
          >
            <EyeSlashIcon className="w-3.5 h-3.5" aria-hidden="true" />
            {isPending ? "Unpublishing..." : "Unpublish"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublishClick}
            disabled={isPending || gradedCount === 0 || isConfirming}
            title={gradedCount === 0 ? "Grade at least one submission first" : undefined}
            className="apple-press shrink-0 self-end sm:self-auto inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MegaphoneIcon className="w-3.5 h-3.5" aria-hidden="true" />
            {isPending ? "Publishing..." : "Publish grades"}
          </button>
        )}
      </div>

      {isConfirming && !published ? (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-950">
            {pendingCount} {pendingCount === 1 ? "submission is" : "submissions are"} still ungraded
          </p>
          <p className="mt-0.5 text-[11px] text-amber-800">
            Praktikan with ungraded work will see no score yet. You can keep grading after publishing.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              disabled={isPending}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setPublished(true)}
              disabled={isPending}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {isPending ? "Publishing..." : "Publish anyway"}
            </button>
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <p role="alert" className="text-[11px] font-medium text-rose-700">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

export function getPublishErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Couldn't update grade visibility. Please try again.";
}
