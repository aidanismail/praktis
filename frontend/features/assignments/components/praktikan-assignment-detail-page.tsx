"use client";

import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  FileText,
  Gauge,
  Loader2,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
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
  timeStyle: "short"
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
  assignmentId
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
    enabled: courseVerified
  });

  if (!user) return null;

  if (user.role !== "praktikan") {
    return (
      <PageFrame>
        <div
          role="alert"
          className="rounded-3xl border border-amber-200 bg-amber-50 p-6"
        >
          <h1 className="font-semibold text-amber-950">
            Praktikan access required
          </h1>
          <Link
            href={ROUTES.dashboard}
            className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-amber-900 underline"
          >
            Return to dashboard
          </Link>
        </div>
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
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="ml-3 text-sm text-slate-600">
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
        <div
          role="alert"
          className="rounded-3xl border border-amber-200 bg-amber-50 p-6"
        >
          <AlertCircle className="h-5 w-5 text-amber-700" aria-hidden="true" />
          <h1 className="mt-3 font-semibold text-amber-950">
            Assignment is unavailable
          </h1>
          <p className="mt-2 text-sm text-amber-800">
            The course or assignment is not available in your enrolled classes.
          </p>
          {retryable ? (
            <button
              type="button"
              onClick={() => void coursesQuery.refetch()}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-900 px-4 text-sm font-semibold text-white"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          ) : (
            <Link
              href={ROUTES.dashboard}
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-amber-900 underline"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Return to dashboard
            </Link>
          )}
        </div>
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
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="ml-3 text-sm text-slate-600">
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
        <div
          role="alert"
          className="rounded-3xl border border-red-200 bg-red-50 p-6"
        >
          <h1 className="font-semibold text-red-950">
            Assignment is unavailable
          </h1>
          <p className="mt-2 text-sm text-red-800">
            It may not exist or may not be published for your class.
          </p>
          {retryable ? (
            <button
              type="button"
              onClick={() => void assignmentQuery.refetch()}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          ) : (
            <Link
              href={getCourseDetailRoute(courseId, "assignments")}
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-red-900 underline"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Assignments
            </Link>
          )}
        </div>
      </PageFrame>
    );
  }

  const assignment = assignmentQuery.data;
  const allowedFileTypes = getAllowedAssignmentFileTypes(
    assignment.allowed_file_types
  );

  return (
    <PageFrame>
      <Link
        href={getCourseDetailRoute(courseId, "assignments")}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-slate-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Assignments
      </Link>

      <div className="mt-4 space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                Published
              </span>
              <p className="mt-3 text-sm font-medium text-emerald-700">
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
            <p className="mt-5 text-sm italic text-slate-500">
              No additional instructions.
            </p>
          )}

          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                Due
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-900">
                {assignment.due_date ? (
                  <time dateTime={assignment.due_date}>
                    {formatDate(assignment.due_date)}
                  </time>
                ) : (
                  "No deadline"
                )}
              </dd>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Gauge className="h-4 w-4" aria-hidden="true" />
                Points
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-900">
                {assignment.max_points} maximum
              </dd>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Formats
              </dt>
              <dd className="mt-2 text-sm font-medium uppercase text-slate-900">
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
