"use client";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Loader2,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { getCourseDetailRoute, ROUTES } from "@/constants/routes";
import { SessionAttendanceRegister } from "@/features/attendance/components/session-attendance-register";
import { SessionGradebook } from "@/features/grades/components/session-gradebook";
import { SessionExportPanel } from "@/features/exports/components/session-export-panel";
import { useAssignedCourses } from "@/features/courses/hooks/use-assigned-courses";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { useCourseSessions } from "../hooks/use-course-sessions";
import {
  getSessionAttendanceStatus,
  type CourseSession
} from "../types/session.type";

type AsprakSessionDetailPageProps = {
  courseId: string;
  sessionId: string;
};

type AssignedSessionDetailProps = AsprakSessionDetailPageProps & {
  userId: string;
};

function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">{children}</div>
    </main>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      <span className="ml-3 text-sm text-slate-600">{label}</span>
    </div>
  );
}

function ErrorPanel({
  error,
  onRetry,
  isRetrying,
  backHref
}: {
  error: Error;
  onRetry: () => void;
  isRetrying: boolean;
  backHref: string;
}) {
  const status = error instanceof ApiError ? error.status : null;
  const retryable = status === null || ![401, 403, 404, 422].includes(status);
  let title = "Session details could not be loaded";
  let description = "A network or server problem interrupted the request.";

  if (status === 401) {
    title = "Your session has expired";
    description = "Sign in again to continue.";
  } else if (status === 403) {
    title = "Session access is unavailable";
    description = "You are not assigned to this course.";
  } else if (status === 404) {
    title = "Course sessions were not found";
    description = "The selected course or session is unavailable.";
  } else if (status === 422) {
    title = "Invalid session link";
    description = "Return to the course and open the session again.";
  }

  return (
    <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-semibold text-red-950">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-red-800">{description}</p>
          {status === 401 ? (
            <Link href={ROUTES.login} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-red-700 px-4 text-sm font-semibold text-white">
              Go to sign in
            </Link>
          ) : retryable ? (
            <button type="button" onClick={onRetry} disabled={isRetrying} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              <RefreshCw className={isRetrying ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
              Try again
            </button>
          ) : (
            <Link href={backHref} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-red-900 underline underline-offset-4">
              Back to sessions
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionHeader({ session }: { session: CourseSession }) {
  const status = getSessionAttendanceStatus(session.attendance_status);
  const label =
    status === "OPEN"
      ? "Attendance open"
      : status === "CLOSED"
        ? "Attendance closed"
        : status === "SCHEDULED"
          ? "Scheduled"
          : "Unknown attendance state";

  return (
    <header className="rounded-3xl bg-brand p-6 text-white shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
            Session workspace
          </p>
          <h1 className="mt-2 wrap-break-word text-2xl font-bold tracking-tight sm:text-3xl">
            {session.title}
          </h1>
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-300">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <time dateTime={session.date}>{session.date}</time>
          </p>
        </div>
        <div className="space-y-2 text-right">
          <span className="block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
            {label}
          </span>
          <span className="block text-xs text-slate-300">
            Grades {session.grades_published ? "published" : "draft"}
          </span>
        </div>
      </div>
    </header>
  );
}

function AssignedSessionDetail({
  userId,
  courseId,
  sessionId
}: AssignedSessionDetailProps) {
  const [attendanceDirty, setAttendanceDirty] = useState(false);
  const [gradeDirty, setGradeDirty] = useState(false);
  const coursesQuery = useAssignedCourses(userId);
  const course = coursesQuery.data?.find((item) => item.id === courseId);
  const courseVerified = coursesQuery.isSuccess && Boolean(course);
  const sessionsQuery = useCourseSessions({
    userId,
    courseId,
    enabled: courseVerified
  });

  if (coursesQuery.isPending) {
    return <PageFrame><LoadingPanel label="Verifying course access..." /></PageFrame>;
  }

  if (coursesQuery.isError) {
    return (
      <PageFrame>
        <ErrorPanel
          error={coursesQuery.error}
          onRetry={() => void coursesQuery.refetch()}
          isRetrying={coursesQuery.isFetching}
          backHref={ROUTES.dashboard}
        />
      </PageFrame>
    );
  }

  if (!course) {
    return (
      <PageFrame>
        <div role="alert" className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-lg font-semibold text-amber-950">Course is unavailable</h1>
          <p className="mt-2 text-sm text-amber-800">This course is not part of your assigned practicum classes.</p>
          <Link href={ROUTES.dashboard} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-amber-900 underline underline-offset-4">
            Return to dashboard
          </Link>
        </div>
      </PageFrame>
    );
  }

  if (sessionsQuery.isPending) {
    return <PageFrame><LoadingPanel label="Loading session workspace..." /></PageFrame>;
  }

  if (sessionsQuery.isError) {
    return (
      <PageFrame>
        <ErrorPanel
          error={sessionsQuery.error}
          onRetry={() => void sessionsQuery.refetch()}
          isRetrying={sessionsQuery.isFetching}
          backHref={getCourseDetailRoute(courseId, "sessions")}
        />
      </PageFrame>
    );
  }

  const session = sessionsQuery.data?.find(
    (item) => item.id === sessionId && item.course_id === courseId
  );

  if (!session) {
    return (
      <PageFrame>
        <div role="alert" className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-lg font-semibold text-amber-950">Session is unavailable</h1>
          <p className="mt-2 text-sm text-amber-800">This session does not belong to the selected assigned course.</p>
          <Link href={getCourseDetailRoute(courseId, "sessions")} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-amber-900 underline underline-offset-4">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to sessions
          </Link>
        </div>
      </PageFrame>
    );
  }

  function confirmBackNavigation(event: MouseEvent<HTMLAnchorElement>) {
    if (
      (attendanceDirty || gradeDirty) &&
      !window.confirm("Discard unsaved attendance or grade changes and leave this session?")
    ) {
      event.preventDefault();
    }
  }

  return (
    <PageFrame>
      <Link href={getCourseDetailRoute(courseId, "sessions")} onClick={confirmBackNavigation} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Sessions &amp; Attendance
      </Link>
      <p className="mt-5 text-sm font-medium text-emerald-700">
        {course.code} · {course.name}
      </p>
      <div className="mt-4 space-y-6">
        <SessionHeader session={session} />
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="verified-session-heading">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
            <div>
              <h2 id="verified-session-heading" className="font-semibold text-slate-950">Verified session context</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Attendance, grades, and exports load only after this session is confirmed in your assigned course list.
              </p>
            </div>
          </div>
        </section>
        <SessionAttendanceRegister
          userId={userId}
          courseId={courseId}
          session={session}
          onDirtyChange={setAttendanceDirty}
        />
        <SessionGradebook
          userId={userId}
          courseId={courseId}
          session={session}
          onDirtyChange={setGradeDirty}
        />
        <SessionExportPanel
          userId={userId}
          courseId={courseId}
          session={session}
        />
      </div>
    </PageFrame>
  );
}

export function AsprakSessionDetailPage({
  courseId,
  sessionId
}: AsprakSessionDetailPageProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  if (user.role !== "asprak") {
    return (
      <PageFrame>
        <div role="alert" className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-lg font-semibold text-amber-950">Asprak access required</h1>
          <p className="mt-2 text-sm text-amber-800">Session management is available only to Asprak accounts.</p>
          <Link href={ROUTES.dashboard} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-amber-900 underline underline-offset-4">
            Return to dashboard
          </Link>
        </div>
      </PageFrame>
    );
  }

  return (
    <AssignedSessionDetail
      userId={user.id}
      courseId={courseId}
      sessionId={sessionId}
    />
  );
}
