"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Loader2,
  RefreshCw
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { useAssignedCourses } from "../hooks/use-assigned-courses";
import { CourseRoster } from "./course-roster";

type AsprakCourseDetailPageProps = {
  courseId: string;
};

type AssignedCourseDetailProps = {
  userId: string;
  courseId: string;
};

function DetailPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">{children}</div>
    </main>
  );
}

function AssignedCourseDetail({ userId, courseId }: AssignedCourseDetailProps) {
  const {
    data: courses = [],
    error,
    isError,
    isFetching,
    isPending,
    refetch
  } = useAssignedCourses(userId);

  if (isPending) {
    return (
      <DetailPageFrame>
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-72 items-center justify-center
            rounded-3xl border border-slate-200 bg-white"
        >
          <Loader2
            className="h-6 w-6 animate-spin text-emerald-600"
            aria-hidden="true"
          />
          <span className="ml-3 text-sm text-slate-600">
            Loading course details...
          </span>
        </div>
      </DetailPageFrame>
    );
  }

  if (isError) {
    const isUnauthorized = error instanceof ApiError && error.status === 401;
    const isForbidden = error instanceof ApiError && error.status === 403;

    return (
      <DetailPageFrame>
        <div
          role="alert"
          className="rounded-3xl border border-red-200 bg-red-50 p-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
              aria-hidden="true"
            />

            <div>
              <h1 className="text-lg font-semibold text-red-950">
                {isUnauthorized
                  ? "Your session has expired"
                  : isForbidden
                    ? "Course access is unavailable"
                    : "Course details could not be loaded"}
              </h1>

              <p className="mt-2 text-sm leading-6 text-red-800">
                {isUnauthorized
                  ? "Sign in again to continue."
                  : isForbidden
                    ? "Your account cannot access this assigned-course view."
                    : "A network or server problem interrupted the request."}
              </p>

              {isUnauthorized ? (
                <Link
                  href={ROUTES.login}
                  className="mt-4 inline-flex rounded-xl bg-red-700 px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                >
                  Go to sign in
                </Link>
              ) : null}

              {isForbidden ? (
                <Link
                  href={ROUTES.dashboard}
                  className="mt-4 inline-flex rounded-xl bg-red-700 px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                >
                  Return to dashboard
                </Link>
              ) : null}

              {!isUnauthorized && !isForbidden ? (
                <button
                  type="button"
                  onClick={() => void refetch()}
                  disabled={isFetching}
                  className="mt-4 inline-flex items-center
                    gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                    aria-hidden="true"
                  />
                  {isFetching ? "Retrying..." : "Try again"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </DetailPageFrame>
    );
  }

  const course = courses.find((item) => item.id === courseId);

  if (!course) {
    return (
      <DetailPageFrame>
        <div
          role="alert"
          className="rounded-3xl border border-amber-200 bg-amber-50 p-6"
        >
          <h1 className="text-lg font-semibold text-amber-950">
            Course is unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            This course does not exist in your assigned practicum classes.
          </p>
          <Link
            href={ROUTES.dashboard}
            className="mt-4 inline-flex items-center gap-2
              text-sm font-medium text-amber-900 underline
              underline-offset-4"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Return to dashboard
          </Link>
        </div>
      </DetailPageFrame>
    );
  }

  const statusLabel = course.is_active
    ? "Active offering"
    : "Historical offering";

  return (
    <DetailPageFrame>
      <Link
        href={ROUTES.dashboard}
        className="inline-flex items-center gap-2 text-sm
          font-medium text-slate-600 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-emerald-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to dashboard
      </Link>

      <header className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50
              text-emerald-700"
            >
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </span>

            <div>
              <p className="text-sm font-semibold text-emerald-700">
                {course.code}
              </p>
              <h1
                className="mt-1 text-2xl font-semibold
                tracking-tight text-slate-950 sm:text-3xl"
              >
                {course.name}
              </h1>
            </div>
          </div>

          <span
            className={
              course.is_active
                ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800"
                : "rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
            }
          >
            {statusLabel}
          </span>
        </div>

        <div
          className="mt-6 flex flex-wrap gap-x-6 gap-y-2
          border-t border-slate-100 pt-5 text-sm text-slate-600"
        >
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Academic year {course.academic_year}
          </span>
          <span>Semester {course.semester}</span>
        </div>
      </header>
      <CourseRoster userId={userId} courseId={courseId} />
    </DetailPageFrame>
  );
}

export function AsprakCourseDetailPage({
  courseId
}: AsprakCourseDetailPageProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  if (user.role !== "asprak") {
    return (
      <DetailPageFrame>
        <div
          role="alert"
          className="rounded-3xl border border-amber-200 bg-amber-50 p-6"
        >
          <h1 className="text-lg font-semibold text-amber-950">
            Asprak access required
          </h1>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            This course workspace is available only to Asprak accounts.
          </p>
          <Link
            href={ROUTES.dashboard}
            className="mt-4 inline-flex text-sm font-medium
              text-amber-900 underline underline-offset-4"
          >
            Return to dashboard
          </Link>
        </div>
      </DetailPageFrame>
    );
  }

  return <AssignedCourseDetail userId={user.id} courseId={courseId} />;
}
