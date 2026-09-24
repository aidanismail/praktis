"use client";

import Link from "next/link";
import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { ROUTES, type CourseWorkspaceTab } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import {
  getThemeConfig,
  getPatternConfig,
  getCourseBannerTheme,
} from "../constants/banner-themes";
import { useEnrolledCourses } from "../hooks/use-enrolled-courses";
import { PraktikanCourseWorkspaceTabs } from "./praktikan-course-workspace-tabs";
import {
  ArrowLeft,
  CalendarBlank,
  ArrowsClockwise
} from "@phosphor-icons/react";

type Props = { courseId: string; initialTab: CourseWorkspaceTab };

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">{children}</div>
    </main>
  );
}

export function PraktikanCourseDetailPage({ courseId, initialTab }: Props) {
  const user = useAuthStore((state) => state.user);
  const query = useEnrolledCourses(user?.role === "praktikan" ? user.id : "");

  if (!user) return null;

  if (user.role !== "praktikan") {
    return (
      <Frame>
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
      </Frame>
    );
  }

  if (query.isPending) {
    return (
      <Frame>
        <div
          role="status"
          className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white"
        >
          <AsteriskLoader className="h-5 w-5 text-slate-400" aria-hidden="true" />
          <span className="ml-3 text-xs font-medium text-slate-600">Finding your class...</span>
        </div>
      </Frame>
    );
  }

  if (query.isError) {
    const status = query.error instanceof ApiError ? query.error.status : null;
    return (
      <Frame>
        <NotificationBanner variant="error">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div>
              <h3 className="font-semibold text-white">Couldn&apos;t load course details</h3>
              <p className="mt-0.5 text-xs text-slate-300">
                {status === 401
                  ? "You've been signed out. Sign in again to continue."
                  : status === 403
                    ? "You don't have access to this course."
                    : "Couldn't reach the server. Let's try that again."}
              </p>
            </div>
            {status === 401 ? (
              <Link
                href={ROUTES.login}
                className="inline-flex rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition shrink-0"
              >
                Sign in
              </Link>
            ) : status === 403 ? (
              <Link
                href={ROUTES.dashboard}
                className="inline-flex rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition shrink-0"
              >
                Back to dashboard
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition disabled:opacity-60 shrink-0"
              >
                <ArrowsClockwise
                  className={`h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                Try again
              </button>
            )}
          </div>
        </NotificationBanner>
      </Frame>
    );
  }

  const course = (query.data ?? []).find((item) => item.id === courseId);
  if (!course) {
    return (
      <Frame>
        <NotificationBanner variant="warning">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div>
              <h3 className="font-semibold text-white">Course not found</h3>
              <p className="mt-0.5 text-xs text-slate-300">
                You aren&apos;t enrolled in this class, or it might have been archived.
              </p>
            </div>
            <Link
              href={ROUTES.dashboard}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to dashboard
            </Link>
          </div>
        </NotificationBanner>
      </Frame>
    );
  }

  const cTheme = getCourseBannerTheme(course);
  const theme = getThemeConfig(cTheme.themeId);
  const patternCfg = getPatternConfig(cTheme.patternId);

  return (
    <Frame>
      <div className="space-y-4">
        {/* Top back button & breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={ROUTES.dashboard}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-full shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Classes</span>
          </Link>

          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Classes / {course.code}
          </span>
        </div>

        {/* Classroom Header Banner */}
        <div
          className={`${
            !cTheme.imageUrl ? theme.gradientClass : "bg-slate-900"
          } rounded-3xl p-6 sm:p-8 text-white shadow-xs relative overflow-hidden`}
        >
          {cTheme.imageUrl && (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${cTheme.imageUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/70" />
            </>
          )}

          {patternCfg.id !== "none" && (
            <div className={`absolute inset-0 pointer-events-none ${patternCfg.overlayClass}`} />
          )}

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white/90 drop-shadow-xs">
                  {course.code}
                </span>
                <span className="text-white/40" aria-hidden="true">·</span>
                <span className="text-xs font-semibold text-white/80">
                  {course.is_active ? "Active Offering" : "Historical Offering"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mt-2 text-white tracking-tight drop-shadow-xs">
                {course.name}
              </h1>
              <p className="text-xs text-slate-200 mt-1.5 flex items-center gap-2 drop-shadow-xs">
                <CalendarBlank className="w-4 h-4 text-white/70" />
                <span>
                  Academic Year {course.academic_year} • Semester {course.semester}
                </span>
              </p>
            </div>
          </div>
        </div>

        <PraktikanCourseWorkspaceTabs user={user} courseId={courseId} initialTab={initialTab} />
      </div>
    </Frame>
  );
}
