"use client";

import {
  AlertCircle,
  ArrowLeft,
  RefreshCw
} from "lucide-react";
import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getCourseDetailRoute, ROUTES } from "@/constants/routes";
import { SessionAttendanceRegister } from "@/features/attendance/components/session-attendance-register";
import { SessionGradebook } from "@/features/grades/components/session-gradebook";
import { SessionExportPanel } from "@/features/exports/components/session-export-panel";
import { useAssignedCourses } from "@/features/courses/hooks/use-assigned-courses";
import type { Course } from "@/features/courses/types/course.type";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import {
  getThemeConfig,
  getPatternConfig,
  getCourseBannerTheme
} from "@/features/courses/constants/banner-themes";
import {
  useCourseSessions,
  useDeleteCourseSession
} from "../hooks/use-course-sessions";
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
  /** When provided, uses course theme for the session header banner. */
  course?: Course;
  /** When provided, uses in-shell navigation instead of Link href for back button. */
  onBack?: () => void;
};

function LoadingPanel({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white">
      <AsteriskLoader className="h-6 w-6 text-slate-900" aria-hidden="true" />
      <span className="ml-3 text-sm text-slate-600">{label}</span>
    </div>
  );
}

function ErrorPanel({
  error,
  onRetry,
  isRetrying,
  backHref,
  onBack
}: {
  error: Error;
  onRetry: () => void;
  isRetrying: boolean;
  backHref: string;
  onBack?: () => void;
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
            <Link href={ROUTES.login} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-red-700 px-4 text-sm font-semibold text-white">
              Go to sign in
            </Link>
          ) : retryable ? (
            <button type="button" onClick={onRetry} disabled={isRetrying} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-red-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              <RefreshCw className={isRetrying ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
              Try again
            </button>
          ) : onBack ? (
            <button type="button" onClick={onBack} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to sessions
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

function SessionHeader({ session, course }: { session: CourseSession; course?: Course }) {
  const status = getSessionAttendanceStatus(session.attendance_status);
  const attendanceLabel =
    status === "OPEN"
      ? "Attendance open"
      : status === "CLOSED"
        ? "Attendance closed"
        : status === "SCHEDULED"
          ? "Scheduled"
          : "Unknown attendance state";

  const gradesLabel = session.grades_published ? "Grades published" : "Grades draft";

  // Use course theme if available, fall back to brand
  const courseTheme = course ? getCourseBannerTheme(course) : null;
  const themeCfg = courseTheme ? getThemeConfig(courseTheme.themeId) : null;
  const patternCfg = courseTheme ? getPatternConfig(courseTheme.patternId) : null;
  const bannerGradient = (courseTheme && !courseTheme.imageUrl && themeCfg)
    ? themeCfg.gradientClass
    : "bg-brand";

  return (
    <header className={`rounded-3xl p-6 text-white shadow-sm relative overflow-hidden sm:p-8 ${bannerGradient}`}>
      {courseTheme?.imageUrl && (
        <>
          <div
            role="presentation"
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${courseTheme.imageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/70" />
        </>
      )}
      {patternCfg && patternCfg.id !== "none" && (
        <div className={`absolute inset-0 pointer-events-none ${patternCfg.overlayClass}`} />
      )}

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Session workspace
          </p>
          <h1 className="mt-2 wrap-break-word text-2xl font-bold tracking-tight sm:text-3xl">
            {session.title}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            <time dateTime={session.date}>{session.date}</time>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold border border-white/10 backdrop-blur-xs">
            {attendanceLabel}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold border backdrop-blur-xs ${
            session.grades_published
              ? "bg-white/15 border-white/15 text-white"
              : "bg-amber-500/20 border-amber-400/30 text-amber-200"
          }`}>
            {gradesLabel}
          </span>
        </div>
      </div>
    </header>
  );
}

export function AssignedSessionDetail({
  userId,
  courseId,
  sessionId,
  course: courseProp,
  onBack
}: AssignedSessionDetailProps) {
  const router = useRouter();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [attendanceDirty, setAttendanceDirty] = useState(false);
  const [gradeDirty, setGradeDirty] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const deleteMutation = useDeleteCourseSession({ userId, courseId });
  const coursesQuery = useAssignedCourses(userId);
  const course = courseProp ?? coursesQuery.data?.find((item) => item.id === courseId);
  const courseVerified = courseProp ? true : (coursesQuery.isSuccess && Boolean(course));
  const sessionsQuery = useCourseSessions({
    userId,
    courseId,
    enabled: courseVerified
  });

  function navigateBack() {
    if (onBack) {
      onBack();
    } else {
      router.push(getCourseDetailRoute(courseId, "sessions"));
    }
  }

  function handleBackAttempt() {
    if (attendanceDirty || gradeDirty) {
      setShowUnsavedWarning(true);
    } else {
      navigateBack();
    }
  }

  if (!courseProp && coursesQuery.isPending) {
    return <LoadingPanel label="Verifying course access..." />;
  }

  if (!courseProp && coursesQuery.isError) {
    return (
      <ErrorPanel
        error={coursesQuery.error}
        onRetry={() => void coursesQuery.refetch()}
        isRetrying={coursesQuery.isFetching}
        backHref={ROUTES.dashboard}
        onBack={onBack}
      />
    );
  }

  if (!course) {
    return (
      <div role="alert" className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-lg font-semibold text-amber-950">Course is unavailable</h1>
        <p className="mt-2 text-sm text-amber-800">This course is not part of your assigned practicum classes.</p>
        {onBack ? (
          <button type="button" onClick={onBack} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-amber-900 underline underline-offset-4">
            Return to dashboard
          </button>
        ) : (
          <Link href={ROUTES.dashboard} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-amber-900 underline underline-offset-4">
            Return to dashboard
          </Link>
        )}
      </div>
    );
  }

  if (sessionsQuery.isPending) {
    return <LoadingPanel label="Loading session workspace..." />;
  }

  if (sessionsQuery.isError) {
    return (
      <ErrorPanel
        error={sessionsQuery.error}
        onRetry={() => void sessionsQuery.refetch()}
        isRetrying={sessionsQuery.isFetching}
        backHref={getCourseDetailRoute(courseId, "sessions")}
        onBack={onBack}
      />
    );
  }

  const session = sessionsQuery.data?.find(
    (item) => item.id === sessionId && item.course_id === courseId
  );

  if (!session) {
    return (
      <div role="alert" className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-lg font-semibold text-amber-950">Session is unavailable</h1>
        <p className="mt-2 text-sm text-amber-800">This session does not belong to the selected assigned course.</p>
        {onBack ? (
          <button type="button" onClick={onBack} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-amber-900 underline underline-offset-4">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to sessions
          </button>
        ) : (
          <Link href={getCourseDetailRoute(courseId, "sessions")} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-amber-900 underline underline-offset-4">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to sessions
          </Link>
        )}
      </div>
    );
  }

  function handleDeleteSession() {
    deleteMutation.reset();
    deleteMutation.mutate(sessionId, {
      onSuccess: () => navigateBack()
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleBackAttempt}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Sessions &amp; Attendance
        </button>

        {!isConfirmingDelete ? (
          <button
            type="button"
            onClick={() => {
              deleteMutation.reset();
              setIsConfirmingDelete(true);
            }}
            disabled={deleteMutation.isPending}
            className="inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Delete session
          </button>
        ) : null}
      </div>

      {/* Inline unsaved-changes warning (replaces window.confirm) */}
      {showUnsavedWarning ? (
        <div role="alert" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-950">You have unsaved changes</p>
          <p className="mt-1 text-sm text-amber-800">
            Attendance or grade entries have not been saved yet. Leaving now will discard them.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowUnsavedWarning(false)}
              className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Keep editing
            </button>
            <button
              type="button"
              onClick={navigateBack}
              className="rounded-full bg-amber-700 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-800"
            >
              Discard and leave
            </button>
          </div>
        </div>
      ) : null}

      {isConfirmingDelete ? (
        <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-950">Delete session?</p>
          <p className="mt-1 text-sm text-red-800">
            Attendance records and assignments linked to this session will also be deleted. This action cannot be undone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              disabled={deleteMutation.isPending}
              className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteSession}
              disabled={deleteMutation.isPending}
              className="rounded-full bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
          {deleteMutation.isError ? (
            <p className="mt-3 text-sm text-red-800">
              {deleteMutation.error instanceof ApiError && deleteMutation.error.status === 400
                ? deleteMutation.error.message || "Cannot delete session with published grades. Unpublish grades first."
                : deleteMutation.error.message || "Unable to delete session. Please try again."}
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-5 text-sm font-semibold text-slate-700">
        {course.code} · {course.name}
      </p>
      <div className="mt-4 space-y-6">
        <SessionHeader session={session} course={course} />
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
    </div>
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
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div role="alert" className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <h1 className="text-lg font-semibold text-amber-950">Asprak access required</h1>
            <p className="mt-2 text-sm text-amber-800">Session management is available only to Asprak accounts.</p>
            <Link href={ROUTES.dashboard} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-amber-900 underline underline-offset-4">
              Return to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <AssignedSessionDetail
          userId={user.id}
          courseId={courseId}
          sessionId={sessionId}
        />
      </div>
    </main>
  );
}
