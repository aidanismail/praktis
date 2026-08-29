"use client";

import {
  AlertCircle,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Users
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useAssignmentSubmissions } from "../hooks/use-course-assignments";
import type { AssignmentSubmission } from "../types/assignment.type";
import { SubmissionGradeForm } from "./submission-grade-form";

type AssignmentSubmissionsProps = {
  userId: string;
  courseId: string;
  assignmentId: string;
  maxPoints: number;
  enabled: boolean;
};

type SubmissionFilter = "all" | "awaiting-grade" | "graded";

const EMPTY_SUBMISSIONS: AssignmentSubmission[] = [];

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short"
});

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : dateFormatter.format(date);
}

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

function isGraded(submission: AssignmentSubmission) {
  return submission.score !== null;
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

export function AssignmentSubmissions({
  userId,
  courseId,
  assignmentId,
  maxPoints,
  enabled
}: AssignmentSubmissionsProps) {
  const [searchValue, setSearchValue] = useState("");
  const [filter, setFilter] = useState<SubmissionFilter>("all");
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<
    string | null
  >(null);

  const query = useAssignmentSubmissions({
    userId,
    courseId,
    assignmentId,
    enabled
  });

  const submissions = query.data ?? EMPTY_SUBMISSIONS;

  const filteredSubmissions = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return submissions.filter((submission) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        submission.student_username.toLowerCase().includes(normalizedSearch) ||
        (submission.student_email ?? "")
          .toLowerCase()
          .includes(normalizedSearch);

      const graded = isGraded(submission);
      const matchesFilter =
        filter === "all" ||
        (filter === "graded" && graded) ||
        (filter === "awaiting-grade" && !graded);

      return matchesSearch && matchesFilter;
    });
  }, [filter, searchValue, submissions]);

  if (query.isPending) {
    return (
      <section
        aria-labelledby="assignment-submissions-heading"
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2
          id="assignment-submissions-heading"
          className="text-lg font-semibold text-slate-950"
        >
          Praktikan submissions
        </h2>

        <div
          role="status"
          aria-live="polite"
          className="mt-6 flex min-h-40 items-center justify-center"
        >
          <Loader2
            className="h-5 w-5 animate-spin text-slate-700"
            aria-hidden="true"
          />
          <span className="ml-3 text-sm text-slate-600">
            Loading submissions...
          </span>
        </div>
      </section>
    );
  }

  if (query.isError) {
    const unauthorized =
      query.error instanceof ApiError && query.error.status === 401;

    return (
      <section
        aria-labelledby="assignment-submissions-heading"
        className="rounded-3xl border border-red-200 bg-red-50 p-6"
      >
        <h2
          id="assignment-submissions-heading"
          className="text-lg font-semibold text-red-950"
        >
          Submissions are unavailable
        </h2>

        <p role="alert" className="mt-2 text-sm text-red-800">
          {getErrorMessage(query.error)}
        </p>

        {unauthorized ? (
          <Link
            href={ROUTES.login}
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
          >
            Go to sign in
          </Link>
        ) : canRetry(query.error) ? (
          <button
            type="button"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={
                query.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"
              }
              aria-hidden="true"
            />
            Try again
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section
      aria-labelledby="assignment-submissions-heading"
      aria-busy={query.isFetching}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="assignment-submissions-heading"
            className="text-lg font-semibold text-slate-950"
          >
            Praktikan submissions
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Review submitted files and provide private scores and feedback.
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          {submissions.length} {submissions.length === 1 ? "submission" : "submissions"}
        </span>
      </div>

      {query.isFetching ? (
        <p role="status" className="mt-3 text-sm text-slate-500">
          Refreshing submissions...
        </p>
      ) : null}

      {submissions.length === 0 ? (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center"
        >
          <Users
            className="mx-auto h-9 w-9 text-slate-400"
            aria-hidden="true"
          />
          <h3 className="mt-3 font-semibold text-slate-950">
            No submissions yet
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Praktikan submissions will appear here after they upload their work.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <div className="space-y-2">
              <label
                htmlFor="submission-search"
                className="text-sm font-medium text-slate-800"
              >
                Search submissions
              </label>

              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="submission-search"
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search NPM or email"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="submission-status-filter"
                className="text-sm font-medium text-slate-800"
              >
                Grade status
              </label>

              <select
                id="submission-status-filter"
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as SubmissionFilter)
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
              >
                <option value="all">All submissions</option>
                <option value="awaiting-grade">Awaiting grade</option>
                <option value="graded">Graded</option>
              </select>
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div
              role="status"
              className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center"
            >
              <AlertCircle
                className="mx-auto h-8 w-8 text-slate-400"
                aria-hidden="true"
              />
              <h3 className="mt-3 font-semibold text-slate-950">
                No matching submissions
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Adjust the search text or grade-status filter.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredSubmissions.map((submission) => {
                const graded = isGraded(submission);
                const expanded = expandedSubmissionId === submission.id;
                const gradePanelId =
                  `submission-grade-panel-${submission.id}`;

                return (
                  <article
                    key={submission.id}
                    className="rounded-2xl border border-slate-200 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={
                              graded
                                ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                                : "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"
                            }
                          >
                            {graded ? "Graded" : "Awaiting grade"}
                          </span>

                          <span
                            className={
                              submission.is_late
                                ? "rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
                                : "rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700"
                            }
                          >
                            {submission.is_late ? "Late" : "On time"}
                          </span>
                        </div>

                        <h3 className="mt-3 wrap-break-word font-semibold text-slate-950">
                          {submission.student_username}
                        </h3>

                        {submission.student_email ? (
                          <p className="mt-1 wrap-break-word text-sm text-slate-600">
                            {submission.student_email}
                          </p>
                        ) : null}
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Score
                        </p>
                        <p className="mt-1 font-semibold text-slate-950">
                          {submission.score === null
                            ? "Not graded"
                            : `${submission.score} / ${maxPoints}`}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          File
                        </dt>
                        <dd className="mt-1 wrap-break-word text-slate-900">
                          {submission.file_name}
                        </dd>
                        <dd className="mt-1 text-xs text-slate-500">
                          {formatFileSize(submission.file_size)}
                        </dd>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Submitted
                        </dt>
                        <dd className="mt-1 text-slate-900">
                          <time dateTime={submission.submitted_at}>
                            {formatDate(submission.submitted_at)}
                          </time>
                        </dd>
                      </div>
                    </dl>

                    {submission.feedback ? (
                      <div className="mt-4 rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Private feedback
                        </p>
                        <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-700">
                          {submission.feedback}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-3">
                      {submission.download_url ? (
                        <a
                          href={submission.download_url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Download submission from ${submission.student_username}`}
                          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                          Download submission
                        </a>
                      ) : (
                        <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm text-slate-500">
                          <FileText className="h-4 w-4" aria-hidden="true" />
                          Download unavailable
                        </span>
                      )}

                      <button
                        id={`submission-grade-trigger-${submission.id}`}
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={gradePanelId}
                        aria-label={`${graded ? "Edit grade for" : "Grade submission from"} ${submission.student_username}`}
                        onClick={() =>
                          setExpandedSubmissionId(
                            expanded ? null : submission.id
                          )
                        }
                        className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                      >
                        {graded ? "Edit grade" : "Grade submission"}
                      </button>
                    </div>

                    {expanded ? (
                      <div id={gradePanelId} className="mt-4">
                        <SubmissionGradeForm
                          userId={userId}
                          courseId={courseId}
                          assignmentId={assignmentId}
                          maxPoints={maxPoints}
                          submission={submission}
                          onCancel={() => {
                            setExpandedSubmissionId(null);

                            requestAnimationFrame(() => {
                              document
                                .getElementById(
                                  `submission-grade-trigger-${submission.id}`
                                )
                                ?.focus();
                            });
                          }}
                        />
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
