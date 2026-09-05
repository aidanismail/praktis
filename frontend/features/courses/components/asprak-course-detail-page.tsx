"use client";

import type { CourseWorkspaceTab } from "@/constants/routes";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Loader2,
  RefreshCw,
  Palette
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { useAssignedCourses } from "../hooks/use-assigned-courses";
import { CourseWorkspaceTabs } from "./course-workspace-tabs";
import {
  getThemeConfig,
  getPatternConfig,
  getCourseBannerTheme,
  type SavedCourseTheme
} from "../constants/banner-themes";
import { CourseBannerCustomizerModal } from "./course-banner-customizer-modal";

type AsprakCourseDetailPageProps = {
  courseId: string;
  initialTab: CourseWorkspaceTab;
};

type AssignedCourseDetailProps = {
  userId: string;
  courseId: string;
  initialTab: CourseWorkspaceTab;
};

function DetailPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">{children}</div>
    </main>
  );
}

function AssignedCourseDetail({
  userId,
  courseId,
  initialTab
}: AssignedCourseDetailProps) {
  const {
    data: courses = [],
    error,
    isError,
    isFetching,
    isPending,
    refetch
  } = useAssignedCourses(userId);

  const course = courses.find((item) => item.id === courseId);
  const [overrideTheme, setOverrideTheme] = useState<SavedCourseTheme | null>(
    null
  );
  const courseTheme =
    overrideTheme || getCourseBannerTheme(course);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  useEffect(() => {
    const handleThemeUpdate = (e: Event) => {
      const custom = e as CustomEvent<SavedCourseTheme & { courseId: string }>;
      if (custom.detail?.courseId === courseId) {
        setOverrideTheme({
          themeId: custom.detail.themeId,
          patternId: custom.detail.patternId,
          imageUrl: custom.detail.imageUrl
        });
      }
    };
    window.addEventListener("course-theme-updated", handleThemeUpdate);
    return () =>
      window.removeEventListener("course-theme-updated", handleThemeUpdate);
  }, [courseId]);

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
            className="h-6 w-6 animate-spin text-slate-900"
            aria-hidden="true"
          />
          <span className="ml-3 text-sm text-slate-600">
            Getting course details ready...
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
                  ? "You've been signed out"
                  : isForbidden
                    ? "Access restricted"
                    : "Couldn't load course details"}
              </h1>

              <p className="mt-2 text-sm leading-6 text-red-800">
                {isUnauthorized
                  ? "Please sign in again to continue."
                  : isForbidden
                    ? "You don't have instructor access to view this course."
                    : "Couldn't reach the server. Let's try that again."}
              </p>

              {isUnauthorized ? (
                <Link
                  href={ROUTES.login}
                  className="mt-4 inline-flex items-center gap-2
                    rounded-full bg-red-950 px-4 py-2 text-sm font-semibold
                    text-white transition hover:bg-red-900"
                >
                  Return to sign in
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
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="mt-4 inline-flex items-center gap-2
                    rounded-full border border-red-300 bg-white px-4 py-2
                    text-sm font-semibold text-red-950 transition
                    hover:bg-red-100 disabled:cursor-not-allowed
                    disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                    aria-hidden="true"
                  />
                  Try again
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </DetailPageFrame>
    );
  }

  if (!course) {
    return (
      <DetailPageFrame>
        <div
          role="alert"
          className="rounded-3xl border border-amber-200 bg-amber-50 p-6"
        >
          <h1 className="text-lg font-semibold text-amber-950">
            Course not found
          </h1>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            We couldn&apos;t find this course in your assigned classes. It may have been removed or reassigned.
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
    ? "Active"
    : "Archived";

  const themeCfg = getThemeConfig(courseTheme.themeId);
  const patternCfg = getPatternConfig(courseTheme.patternId);

  return (
    <DetailPageFrame>
      <div className="flex items-center justify-between">
        <Link
          href={ROUTES.dashboard}
          className="inline-flex items-center gap-2 text-sm
            font-medium text-slate-600 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2
            focus-visible:outline-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-full shadow-xs transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to dashboard
        </Link>

        <button
          type="button"
          onClick={() => setShowCustomizeModal(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-full shadow-xs transition-colors"
        >
          <Palette className="h-3.5 w-3.5" />
          <span>Customize Banner</span>
        </button>
      </div>

      <header
        className={`mt-5 rounded-3xl p-6 sm:p-8 text-white shadow-xs relative overflow-hidden ${
          !courseTheme.imageUrl ? themeCfg.gradientClass : "bg-slate-900"
        }`}
      >
        {courseTheme.imageUrl && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${courseTheme.imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/70" />
          </>
        )}

        {patternCfg.id !== "none" && (
          <div
            className={`absolute inset-0 pointer-events-none ${patternCfg.overlayClass}`}
          />
        )}

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${themeCfg.badgeBg} px-3 py-1 rounded-full backdrop-blur-xs`}
            >
              {course.code}
            </span>

            <h1
              className="mt-3 text-2xl font-bold
              tracking-tight text-white sm:text-3xl drop-shadow-xs"
            >
              {course.name}
            </h1>
          </div>

          <span className="rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold text-white border border-white/10 backdrop-blur-xs">
            {statusLabel}
          </span>
        </div>

        <div
          className="mt-6 flex flex-wrap gap-x-6 gap-y-2
          border-t border-white/15 pt-5 text-sm text-slate-200 relative z-10"
        >
          <span className="inline-flex items-center gap-2">
            <CalendarDays
              className="h-4 w-4 text-white/70"
              aria-hidden="true"
            />
            Academic year {course.academic_year}
          </span>
          <span>Semester {course.semester}</span>
        </div>
      </header>

      <CourseWorkspaceTabs
        userId={userId}
        courseId={courseId}
        initialTab={initialTab}
      />

      {showCustomizeModal && (
        <CourseBannerCustomizerModal
          isOpen={showCustomizeModal}
          course={course}
          onClose={() => setShowCustomizeModal(false)}
          onSaved={(savedTheme) => {
            setOverrideTheme(savedTheme);
          }}
        />
      )}
    </DetailPageFrame>
  );
}

export function AsprakCourseDetailPage({
  courseId,
  initialTab
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
            Instructor access required
          </h1>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            This workspace is reserved for teaching assistants and lab instructors.
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

  return (
    <AssignedCourseDetail
      userId={user.id}
      courseId={courseId}
      initialTab={initialTab}
    />
  );
}
