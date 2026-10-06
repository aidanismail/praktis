"use client";

import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getCourseDetailRoute, ROUTES } from "@/constants/routes";
import { SessionAttendanceRegister } from "@/features/attendance/components/session-attendance-register";
import { SessionExportPanel } from "@/features/exports/components/session-export-panel";
import { useAssignedCourses } from "@/features/courses/hooks/use-assigned-courses";
import type { Course } from "@/features/courses/types/course.type";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import {
  useCourseSessions,
  useDeleteCourseSession
} from "../hooks/use-course-sessions";
import {
  getSessionAttendanceStatus,
  type CourseSession
} from "../types/session.type";
import {
  WarningCircleIcon,
  ArrowLeftIcon,
  ArrowsClockwiseIcon,
  TrashIcon,
  CalendarCheckIcon,
  DownloadSimpleIcon
} from "@phosphor-icons/react";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium"
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

type AsprakSessionDetailPageProps = {
  courseId: string;
  sessionId: string;
};

type AssignedSessionDetailProps = AsprakSessionDetailPageProps & {
  userId: string;
  course?: Course;
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
        <WarningCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-semibold text-red-950">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-red-800">{description}</p>
          {status === 401 ? (
            <Link href={ROUTES.login} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-red-700 px-4 text-sm font-semibold text-white">
              Go to sign in
            </Link>
          ) : retryable ? (
            <button type="button" onClick={onRetry} disabled={isRetrying} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-red-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              <ArrowsClockwiseIcon className={isRetrying ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
              Try again
            </button>
          ) : onBack ? (
            <button type="button" onClick={onBack} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
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

type SessionSubTab = "attendance" | "exports";

function SessionSummary({
  session,
  courseCode,
  courseName
}: {
  session: CourseSession;
  courseCode?: string;
  courseName?: string;
}) {
  const status = getSessionAttendanceStatus(session.attendance_status);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {courseCode && (
              <>
                <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400">
                  {courseCode}{courseName ? ` · ${courseName}` : ""}
                </span>
                <span className="text-slate-300" aria-hidden="true">·</span>
              </>
            )}

            <span className="text-slate-500 font-medium">
              <time dateTime={session.date}>{formatDate(session.date)}</time>
            </span>
          </div>

          <h1 className="mt-2.5 wrap-break-word text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            {session.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {status === "OPEN" ? (
            <span className="inline-flex items-center font-semibold text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
              Attendance Open
            </span>
          ) : status === "CLOSED" ? (
            <span className="inline-flex items-center font-medium text-xs text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
              Attendance Closed
            </span>
          ) : (
            <span className="inline-flex items-center font-medium text-xs text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Attendance Scheduled
            </span>
          )}
        </div>
      </div>
    </section>
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
  const [activeSubTab, setActiveSubTab] = useState<SessionSubTab>("attendance");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [attendanceDirty, setAttendanceDirty] = useState(false);
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
    if (attendanceDirty) {
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
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Back to sessions
          </button>
        ) : (
          <Link href={getCourseDetailRoute(courseId, "sessions")} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-amber-900 underline underline-offset-4">
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
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
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBackAttempt}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-full shadow-xs apple-press transition-colors cursor-pointer"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Sessions</span>
        </button>

        {!isConfirmingDelete ? (
          <button
            type="button"
            onClick={() => {
              deleteMutation.reset();
              setIsConfirmingDelete(true);
            }}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-white border border-rose-200 hover:bg-rose-50 px-3.5 py-2 rounded-full shadow-xs apple-press transition-colors cursor-pointer disabled:opacity-60"
          >
            <TrashIcon className="w-3.5 h-3.5 text-rose-500" />
            <span>Delete session</span>
          </button>
        ) : null}
      </div>

      {showUnsavedWarning ? (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-950">You have unsaved changes</p>
          <p className="mt-1 text-xs text-amber-800">
            Attendance entries have not been saved yet. Leaving now will discard them.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowUnsavedWarning(false)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Keep editing
            </button>
            <button
              type="button"
              onClick={navigateBack}
              className="rounded-full bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
            >
              Discard and leave
            </button>
          </div>
        </div>
      ) : null}

      {isConfirmingDelete ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-950">Delete session?</p>
          <p className="mt-1 text-xs text-red-800">
            Attendance records and assignments linked to this session will also be deleted. This action cannot be undone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              disabled={deleteMutation.isPending}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteSession}
              disabled={deleteMutation.isPending}
              className="rounded-full bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
          {deleteMutation.isError ? (
            <p className="mt-3 text-xs text-red-800">
              {deleteMutation.error.message || "Unable to delete session. Please try again."}
            </p>
          ) : null}
        </div>
      ) : null}

      <SessionSummary
        session={session}
        courseCode={course.code}
        courseName={course.name}
      />

      <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab("attendance")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all apple-press ${
            activeSubTab === "attendance"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CalendarCheckIcon className="w-4 h-4 text-slate-500" />
          <span>Attendance Register</span>
          {attendanceDirty && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Unsaved changes" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("exports")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all apple-press ${
            activeSubTab === "exports"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <DownloadSimpleIcon className="w-4 h-4 text-slate-500" />
          <span>Export Records</span>
        </button>
      </div>

      <div className={activeSubTab === "attendance" ? "block" : "hidden"}>
        <SessionAttendanceRegister
          userId={userId}
          courseId={courseId}
          session={session}
          onDirtyChange={setAttendanceDirty}
        />
      </div>

      <div className={activeSubTab === "exports" ? "block" : "hidden"}>
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
