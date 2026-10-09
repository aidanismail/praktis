"use client";

import {
  ArrowsClockwiseIcon,
  ChecksIcon,
  DownloadSimpleIcon,
  EyeIcon,
  FileTextIcon,
  MagnifyingGlassIcon,
  XIcon
} from "@phosphor-icons/react";

import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import { DocumentPreviewModal } from "@/components/ui/document-preview-modal";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ROUTES } from "@/constants/routes";
import { useCourseRoster } from "@/features/courses/hooks/use-course-roster";
import { useModalFocusTrap } from "@/hooks/use-modal-focus-trap";
import { ApiError } from "@/lib/api/client";
import { downloadAssignmentGradesExport } from "@/features/exports/api/assignment-exports.api";
import { useExportDownload } from "@/features/exports/hooks/use-export-download";
import { formatDateTime } from "@/lib/format/date";
import {
  useAssignmentSubmissions,
  useSetAssignmentGradesPublished
} from "../hooks/use-course-assignments";
import type { Assignment, AssignmentSubmission } from "../types/assignment.type";
import { GradePublishBar, getPublishErrorMessage } from "./grade-publish-bar";
import { SubmissionGradeForm } from "./submission-grade-form";

type AssignmentSubmissionsProps = {
  userId: string;
  courseId: string;
  courseCode: string;
  assignment: Assignment;
};

type SubmissionFilter = "all" | "pending" | "graded";

const EMPTY_SUBMISSIONS: AssignmentSubmission[] = [];

function formatFileSize(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return "Size unavailable";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getStudentLabel(submission: AssignmentSubmission) {
  return submission.student_name
    ? `${submission.student_name} (${submission.student_username})`
    : submission.student_username;
}

function getErrorMessage(error: Error) {
  if (!(error instanceof ApiError)) {
    return "Submissions could not be loaded. Try again.";
  }

  if (error.status === 401) {
    return "Your session has expired. Sign in again to continue.";
  }

  if (error.status === 403) {
    return "You are not allowed to review submissions for this assignment.";
  }

  if (error.status === 404) {
    return "This assignment is no longer available in the selected course.";
  }

  if (error.status === 422) {
    return "The assignment link is invalid.";
  }

  return "A network or server problem interrupted the submissions request.";
}

function canRetry(error: Error) {
  return !(
    error instanceof ApiError && [401, 403, 404, 422].includes(error.status)
  );
}

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
        {label}
      </span>
      <span className="text-lg font-bold text-slate-900 mt-0.5 block tabular-nums">
        {value}
      </span>
    </div>
  );
}

export function AssignmentSubmissions({
  userId,
  courseId,
  courseCode,
  assignment
}: AssignmentSubmissionsProps) {
  const [searchValue, setSearchValue] = useState("");
  const [filter, setFilter] = useState<SubmissionFilter>("all");
  const [gradingSubmission, setGradingSubmission] =
    useState<AssignmentSubmission | null>(null);
  const [previewSubmission, setPreviewSubmission] =
    useState<AssignmentSubmission | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const exportDownload = useExportDownload();

  const maxPoints = assignment.max_points;

  const query = useAssignmentSubmissions({
    userId,
    courseId,
    assignmentId: assignment.id,
    enabled: true
  });
  const rosterQuery = useCourseRoster({ userId, courseId, enabled: true });
  const publishMutation = useSetAssignmentGradesPublished({
    userId,
    courseId,
    assignmentId: assignment.id
  });

  const gradeModalRef = useModalFocusTrap<HTMLDivElement>({
    isOpen: Boolean(gradingSubmission),
    onClose: () => setGradingSubmission(null)
  });

  const submissions = query.data ?? EMPTY_SUBMISSIONS;

  const gradedCount = useMemo(
    () => submissions.filter((s) => s.score !== null).length,
    [submissions]
  );
  const pendingCount = submissions.length - gradedCount;

  const filteredSubmissions = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return submissions.filter((submission) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          submission.student_username,
          submission.student_name,
          submission.student_email,
          submission.file_name
        ].some((value) => (value ?? "").toLowerCase().includes(normalizedSearch));

      if (!matchesSearch) return false;
      if (filter === "pending") return submission.score === null;
      if (filter === "graded") return submission.score !== null;
      return true;
    });
  }, [filter, searchValue, submissions]);

  if (query.isPending) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-40 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-xs"
      >
        <AsteriskLoader className="h-5 w-5 text-slate-700" aria-hidden="true" />
        <span className="ml-3 text-xs text-slate-500">Loading submissions...</span>
      </div>
    );
  }

  if (query.isError) {
    const unauthorized =
      query.error instanceof ApiError && query.error.status === 401;

    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-sm font-bold text-rose-950">Submissions are unavailable</h2>
        <p role="alert" className="mt-1 text-xs text-rose-800">
          {getErrorMessage(query.error)}
        </p>

        {unauthorized ? (
          <Link
            href={ROUTES.login}
            className="mt-4 inline-flex items-center rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white"
          >
            Go to sign in
          </Link>
        ) : canRetry(query.error) ? (
          <button
            type="button"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            <ArrowsClockwiseIcon
              className={query.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"}
              aria-hidden="true"
            />
            Try again
          </button>
        ) : null}
      </section>
    );
  }

  const filterOptions: { value: SubmissionFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: submissions.length },
    { value: "pending", label: "Needs Grading", count: pendingCount },
    { value: "graded", label: "Graded", count: gradedCount }
  ];

  return (
    <section
      aria-labelledby="assignment-submissions-heading"
      aria-busy={query.isFetching}
      className="space-y-4"
    >
      {actionSuccess && (
        <div
          role="status"
          className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-xs font-medium text-white flex items-center justify-between shadow-xs"
        >
          <span>{actionSuccess}</span>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-slate-400 hover:text-white"
            aria-label="Dismiss"
          >
            <XIcon className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="assignment-submissions-heading"
            className="text-base font-bold tracking-tight text-slate-950"
          >
            Student Work
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Review submitted files, then grade and publish scores.
          </p>
        </div>

        <div role="group" className="flex items-center gap-2" aria-label="Export grades">
          {(["csv", "xlsx"] as const).map((format) => (
            <button
              key={format}
              type="button"
              onClick={() =>
                void exportDownload.run(format, () =>
                  downloadAssignmentGradesExport(assignment.id, format)
                )
              }
              disabled={exportDownload.busyKey !== null}
              className="apple-press inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold uppercase text-slate-700 shadow-xs transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              <DownloadSimpleIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {exportDownload.busyKey === format ? "Preparing..." : format}
            </button>
          ))}
        </div>
      </div>

      {exportDownload.error && (
        <div
          role="alert"
          className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-800 flex items-center justify-between gap-3"
        >
          <span>{exportDownload.error}</span>
          <button
            type="button"
            onClick={exportDownload.clearError}
            className="text-rose-600 hover:text-rose-900"
            aria-label="Dismiss export error"
          >
            <XIcon className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill
          label="Total Students"
          value={rosterQuery.data ? rosterQuery.data.length : "—"}
        />
        <StatPill label="Turned In" value={submissions.length} />
        <StatPill label="Graded" value={gradedCount} />
        <StatPill label="Needs Grading" value={pendingCount} />
      </div>

      <GradePublishBar
        published={assignment.grades_published}
        publishedAt={assignment.grades_published_at}
        pendingCount={pendingCount}
        gradedCount={gradedCount}
        isPending={publishMutation.isPending}
        errorMessage={publishMutation.isError ? getPublishErrorMessage(publishMutation.error) : null}
        onSetPublished={(published) => {
          publishMutation.reset();
          return publishMutation.mutateAsync(published);
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <label htmlFor="submission-search" className="sr-only">
            Search submissions
          </label>
          <input
            id="submission-search"
            type="search"
            placeholder="Search by student, email, or file name..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
          />
          <MagnifyingGlassIcon
            className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none"
            aria-hidden="true"
          />
        </div>

        <div
          role="group"
          aria-label="Filter by grade status"
          className="flex items-center gap-1.5 self-end sm:self-auto bg-white border border-slate-200 rounded-full p-1 shadow-xs"
        >
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                filter === option.value
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div
          role="status"
          className="p-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2"
        >
          <FileTextIcon className="w-8 h-8 text-slate-300 mx-auto" aria-hidden="true" />
          <p className="font-semibold text-slate-600">
            {submissions.length === 0 ? "No submissions yet" : "No matching submissions"}
          </p>
          <p className="text-[11px]">
            {submissions.length === 0
              ? "No one has turned in this assignment yet."
              : "No submissions match your search or filter."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {filteredSubmissions.map((submission) => {
            const graded = submission.score !== null;
            const studentLabel = getStudentLabel(submission);

            return (
              <div
                key={submission.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    aria-hidden="true"
                    className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5"
                  >
                    {(submission.student_name || submission.student_username)
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <h3 className="font-bold text-xs text-slate-900 wrap-break-word">
                        {studentLabel}
                      </h3>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      {submission.is_late ? (
                        <span className="text-xs font-semibold text-rose-700">Late</span>
                      ) : (
                        <span className="text-xs font-medium text-slate-500">On time</span>
                      )}
                    </div>
                    {submission.student_email ? (
                      <p className="text-[11px] text-slate-500 wrap-break-word">
                        {submission.student_email}
                      </p>
                    ) : null}
                    <p className="text-[11px] text-slate-500 mt-0.5 wrap-break-word">
                      Turned in{" "}
                      <time dateTime={submission.submitted_at}>
                        {formatDateTime(submission.submitted_at)}
                      </time>{" "}
                      • <span className="font-mono text-slate-700">{submission.file_name}</span>{" "}
                      <span className="text-slate-400">({formatFileSize(submission.file_size)})</span>
                    </p>
                    {submission.feedback && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 mt-2 whitespace-pre-wrap wrap-break-word">
                        <span className="font-semibold text-slate-700">Feedback: </span>
                        {submission.feedback}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
                  {graded ? (
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 tabular-nums">
                      <ChecksIcon className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                      <span>
                        {submission.score} / {maxPoints} pts
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-700">Ungraded</span>
                  )}

                  {submission.download_url ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setPreviewSubmission(submission)}
                        className="apple-press px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <EyeIcon className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Preview</span>
                      </button>

                      <a
                        href={submission.download_url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Download submission from ${studentLabel}`}
                        title="Download student submission"
                        className="apple-press px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <DownloadSimpleIcon className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="hidden md:inline">Download</span>
                      </a>
                    </>
                  ) : (
                    <span className="text-[11px] text-slate-400">File unavailable</span>
                  )}

                  <button
                    type="button"
                    onClick={() => setGradingSubmission(submission)}
                    aria-label={`${graded ? "Edit grade for" : "Grade submission from"} ${studentLabel}`}
                    className="apple-press px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors"
                  >
                    {graded ? "Edit Grade" : "Grade"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {gradingSubmission && (
        <div
          ref={gradeModalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="grade-submission-modal-title"
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center overflow-y-auto p-4"
        >
          <SubmissionGradeForm
            key={gradingSubmission.id}
            userId={userId}
            courseId={courseId}
            assignmentId={assignment.id}
            maxPoints={maxPoints}
            submission={gradingSubmission}
            titleId="grade-submission-modal-title"
            onCancel={() => setGradingSubmission(null)}
            onSaved={(saved) => {
              setGradingSubmission(null);
              setActionSuccess(
                assignment.grades_published
                  ? `Grade saved for ${getStudentLabel(saved)}. It's visible to the student.`
                  : `Grade saved for ${getStudentLabel(saved)}. Publish grades when you're ready.`
              );
            }}
          />
        </div>
      )}

      <DocumentPreviewModal
        isOpen={Boolean(previewSubmission)}
        title={
          previewSubmission
            ? `${previewSubmission.student_username} - ${previewSubmission.file_name}`
            : ""
        }
        courseCode={courseCode}
        fileUrl={previewSubmission?.download_url || null}
        fileExtension={previewSubmission?.file_name.split(".").pop() || "pdf"}
        onClose={() => setPreviewSubmission(null)}
      />
    </section>
  );
}
