"use client";

import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import Link from "next/link";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { getCourseDetailRoute, ROUTES } from "@/constants/routes";
import { useEnrolledCourses } from "@/features/courses/hooks/use-enrolled-courses";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { useAssignmentDetail } from "../hooks/use-course-assignments";
import { getAllowedAssignmentFileTypes } from "../schemas/assignment.schema";
import { PraktikanAssignmentUploadForm } from "./praktikan-assignment-upload-form";
import { PraktikanSubmissionSummary } from "./praktikan-submission-summary";
import {
  ArrowLeft,
  CalendarCheck,
  FileText,
  ArrowsClockwise
} from "@phosphor-icons/react";

type PraktikanAssignmentDetailPageProps = {
  assignmentId: string;
  courseId: string;
  onBack?: () => void;
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

function PageFrame({
  children,
  isEmbedded,
}: {
  children: React.ReactNode;
  isEmbedded?: boolean;
}) {
  if (isEmbedded) {
    return <div className="space-y-6">{children}</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">{children}</div>
    </main>
  );
}

export function PraktikanAssignmentDetailPage({
  courseId,
  assignmentId,
  onBack,
}: PraktikanAssignmentDetailPageProps) {
  const user = useAuthStore((state) => state.user);
  const coursesQuery = useEnrolledCourses(
    user?.role === "praktikan" ? user.id : ""
  );
  const course = (coursesQuery.data ?? []).find(
    (enrolledCourse) => enrolledCourse.id === courseId
  );
  const courseVerified = Boolean(
    user?.role === "praktikan" &&
      !coursesQuery.isPending &&
      !coursesQuery.isError &&
      course
  );
  const assignmentQuery = useAssignmentDetail({
    userId: user?.id ?? "",
    courseId,
    assignmentId,
    enabled: courseVerified,
  });

  if (!user) return null;

  const isEmbedded = Boolean(onBack);

  if (user.role !== "praktikan") {
    return (
      <PageFrame isEmbedded={isEmbedded}>
        <NotificationBanner variant="warning">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div>
              <h3 className="font-semibold text-white">Praktikan access required</h3>
              <p className="mt-0.5 text-xs text-slate-300">You need a student account to view this page.</p>
            </div>
            <Link
              href={ROUTES.dashboard}
              className="inline-flex rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition shrink-0"
            >
              Return to dashboard
            </Link>
          </div>
        </NotificationBanner>
      </PageFrame>
    );
  }

  if (coursesQuery.isPending) {
    return (
      <PageFrame isEmbedded={isEmbedded}>
        <div
          role="status"
          className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white"
        >
          <AsteriskLoader className="h-5 w-5 text-slate-400" />
          <span className="ml-3 text-xs font-medium text-slate-600">
            Checking course enrollment...
          </span>
        </div>
      </PageFrame>
    );
  }

  if (coursesQuery.isError || !course) {
    const retryable =
      coursesQuery.isError &&
      !(
        coursesQuery.error instanceof ApiError &&
        [401, 403].includes(coursesQuery.error.status)
      );

    return (
      <PageFrame isEmbedded={isEmbedded}>
        <NotificationBanner variant="warning">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div>
              <h3 className="font-semibold text-white">Assignment not found</h3>
              <p className="mt-0.5 text-xs text-slate-300">
                This assignment might have been removed, or you aren&apos;t enrolled in this class.
              </p>
            </div>
            {retryable ? (
              <button
                type="button"
                onClick={() => void coursesQuery.refetch()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition shrink-0"
              >
                <ArrowsClockwise className="h-3.5 w-3.5" aria-hidden="true" />
                Try again
              </button>
            ) : onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Back to Assignments
              </button>
            ) : (
              <Link
                href={ROUTES.dashboard}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Back to dashboard
              </Link>
            )}
          </div>
        </NotificationBanner>
      </PageFrame>
    );
  }

  if (assignmentQuery.isPending) {
    return (
      <PageFrame isEmbedded={isEmbedded}>
        <div
          role="status"
          className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white"
        >
          <AsteriskLoader className="h-5 w-5 text-slate-400" />
          <span className="ml-3 text-xs font-medium text-slate-600">
            Loading assignment...
          </span>
        </div>
      </PageFrame>
    );
  }

  if (
    assignmentQuery.isError ||
    !assignmentQuery.data ||
    assignmentQuery.data.course_id !== courseId ||
    !assignmentQuery.data.is_published
  ) {
    const status =
      assignmentQuery.error instanceof ApiError
        ? assignmentQuery.error.status
        : null;
    const retryable =
      assignmentQuery.isError &&
      (status === null || ![401, 403, 404, 422].includes(status));

    return (
      <PageFrame isEmbedded={isEmbedded}>
        <NotificationBanner variant="error">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div>
              <h3 className="font-semibold text-white">Assignment unavailable</h3>
              <p className="mt-0.5 text-xs text-slate-300">
                This assignment might still be a draft, or was unpublished by your assistant.
              </p>
            </div>
            {retryable ? (
              <button
                type="button"
                onClick={() => void assignmentQuery.refetch()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition shrink-0"
              >
                <ArrowsClockwise className="h-3.5 w-3.5" aria-hidden="true" />
                Try again
              </button>
            ) : onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Back to Assignments
              </button>
            ) : (
              <Link
                href={getCourseDetailRoute(courseId, "assignments")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Back to Assignments
              </Link>
            )}
          </div>
        </NotificationBanner>
      </PageFrame>
    );
  }

  const assignment = assignmentQuery.data;
  const allowedFileTypes = getAllowedAssignmentFileTypes(
    assignment.allowed_file_types
  );

  return (
    <PageFrame isEmbedded={isEmbedded}>
      <div className="space-y-6">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between gap-4">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-full shadow-xs apple-press transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Assignments</span>
            </button>
          ) : (
            <Link
              href={getCourseDetailRoute(courseId, "assignments")}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-full shadow-xs apple-press transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Assignments</span>
            </Link>
          )}

          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {course.code} / Assignments
          </span>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7/12 cols: Assignment Details & Instructions */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {course.code} · {course.name}
                    </span>
                    <span className="text-slate-300" aria-hidden="true">·</span>
                    <span className="text-xs font-semibold text-slate-700">
                      Published
                    </span>
                  </div>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                    {assignment.title}
                  </h1>
                </div>
              </div>

              {assignment.description ? (
                <p className="mt-5 whitespace-pre-wrap wrap-break-word text-sm leading-7 text-slate-700">
                  {assignment.description}
                </p>
              ) : (
                <p className="mt-5 text-xs italic text-slate-400">
                  No additional instructions provided.
                </p>
              )}

              {/* Clean Typographic Metadata Layout (No Card Boxes, No Points) */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5 border-t border-slate-100 pt-5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                    Due:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {assignment.due_date ? (
                      <time dateTime={assignment.due_date}>
                        {formatDate(assignment.due_date)}
                      </time>
                    ) : (
                      "No deadline"
                    )}
                  </span>
                </div>

                {allowedFileTypes.length > 0 && (
                  <>
                    <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                      ·
                    </span>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                      <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                        Accepted Formats:
                      </span>
                      <span className="font-semibold uppercase tracking-wide text-slate-800">
                        {allowedFileTypes.join(", ")}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>

          {/* Right 5/12 cols: Submission Summary & Upload Dropzone (sticky) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-20">
            <PraktikanSubmissionSummary
              submission={assignment.my_submission}
              maxPoints={assignment.max_points}
            />

            <PraktikanAssignmentUploadForm
              userId={user.id}
              courseId={courseId}
              assignmentId={assignmentId}
              allowedFileTypes={allowedFileTypes}
              hasSubmission={Boolean(assignment.my_submission)}
            />
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
