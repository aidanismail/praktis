"use client";

import {
  ArrowLeftIcon,
  ArrowsClockwiseIcon,
  WarningCircleIcon
} from "@phosphor-icons/react";
import { AsteriskLoader } from "@/components/ui/asterisk-loader";

type CourseLookupStateProps = {
  status: "loading" | "error" | "missing";
  onBack: () => void;
  onRetry?: () => void;
};

export function CourseLookupState({
  status,
  onBack,
  onRetry
}: CourseLookupStateProps) {
  if (status === "loading") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[40vh] items-center justify-center gap-3 text-slate-600"
      >
        <AsteriskLoader className="h-5 w-5 text-slate-900" />
        <span className="text-sm font-medium">Loading course...</span>
      </div>
    );
  }

  const isError = status === "error";

  return (
    <div
      role="alert"
      className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xs sm:p-8"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <WarningCircleIcon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-bold text-slate-900">
        {isError
          ? "Couldn't load this course"
          : "Course not found or you don't have access"}
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        {isError
          ? "Something went wrong while loading your courses. Check your connection and try again."
          : "The link may be outdated, or this course isn't part of your account."}
      </p>
      <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
        {isError && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 sm:w-auto"
          >
            <ArrowsClockwiseIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Try again
          </button>
        ) : null}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Back to courses
        </button>
      </div>
    </div>
  );
}
