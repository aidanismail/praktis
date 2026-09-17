"use client";

import {
  ArrowLeft,
  CalendarClock,
  FileText,
  Gauge,
  Loader2,
  RefreshCw,
} from "lucide-react";
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

type PraktikanAssignmentDetailPageProps = {
  assignmentId: string;
  courseId: string;
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

function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">{children}</div>
    </main>
  );
}

export function PraktikanAssignmentDetailPage({
  courseId,
  assignmentId,
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

  if (user.role !== "praktikan") {
    return (
      <PageFrame>
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
      <PageFrame>
        <div
          role="status"
          className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white"
        >
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-hidden="true" />
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
      <PageFrame>
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
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Try again
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
      <PageFrame>
        <div
          role="status"
          className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white"
        >
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-hidden="true" />
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
      <PageFrame>
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
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Try again
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
    <PageFrame>
      <div className="space-y-5">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <Link
            href={getCourseDetailRoute(courseId, "assignments")}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-full shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Assignments</span>
          </Link>

          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {course.code} / Assignments
          </span>
        </div>

        {/* Assignment Info Card */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Published
              </span>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                {course.code} · {course.name}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
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
              No additional instructions.
            </p>
          )}

          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50 p-4">
              <dt className="flex items-center gap-2 text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                <CalendarClock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                Due
              </dt>
              <dd className="mt-2 text-sm font-bold text-slate-900">
                {assignment.due_date ? (
                  <time dateTime={assignment.due_date}>
                    {formatDate(assignment.due_date)}
                  </time>
                ) : (
                  "No deadline"
                )}
              </dd>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-slate-50 p-4">
              <dt className="flex items-center gap-2 text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                <Gauge className="h-4 w-4 text-slate-400" aria-hidden="true" />
                Points
              </dt>
              <dd className="mt-2 text-sm font-bold text-slate-900">
                {assignment.max_points} maximum
              </dd>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-slate-50 p-4">
              <dt className="flex items-center gap-2 text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                <FileText className="h-4 w-4 text-slate-400" aria-hidden="true" />
                Formats
              </dt>
              <dd className="mt-2 text-sm font-bold uppercase text-slate-900">
                {allowedFileTypes.join(", ") || "None supported"}
              </dd>
            </div>
          </dl>
        </section>

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
    </PageFrame>
  );
}
