"use client";

import Link from "next/link";
import { AlertCircle, Loader2, Megaphone, RefreshCw } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useCourseAnnouncements } from "../hooks/use-course-announcements";
import { AnnouncementCard } from "./announcement-card";
import { AnnouncementComposer } from "./announcement-composer";
import { PraktikanAnnouncementCard } from "./praktikan-announcement-card";

type CourseStreamProps = {
  userId: string;
  courseId: string;
  viewerRole: "asprak" | "praktikan";
};

export function CourseStream({ userId, courseId, viewerRole }: CourseStreamProps) {
  const {
    data: announcements = [],
    error,
    isError,
    isFetching,
    isPending,
    refetch
  } = useCourseAnnouncements({ userId, courseId, enabled: true });

  const isUnauthorized = error instanceof ApiError && error.status === 401;
  const isForbidden = error instanceof ApiError && error.status === 403;
  const isNotFound = error instanceof ApiError && error.status === 404;

  if (isPending) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-56 items-center justify-center rounded-3xl border border-slate-200 bg-white"
      >
        <Loader2 className="h-5 w-5 animate-spin text-slate-900" aria-hidden="true" />
        <span className="ml-3 text-sm text-slate-600">Loading course Stream...</span>
      </div>
    );
  }

  if (isError) {
    let title = "Course Stream could not be loaded";
    let description = "A network or server problem interrupted the request.";

    if (isUnauthorized) {
      title = "Your session has expired";
      description = "Sign in again to continue.";
    } else if (isForbidden) {
      title = "Stream access is unavailable";
      description = "Your account is not allowed to access this course Stream.";
    } else if (isNotFound) {
      title = "Course Stream was not found";
      description = "This course may no longer exist or be assigned to you.";
    }

    return (
      <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-red-950">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-red-800">{description}</p>
            {isUnauthorized ? (
              <Link
                href={ROUTES.login}
                className="mt-4 inline-flex rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
              >
                Go to sign in
              </Link>
            ) : null}
            {isForbidden || isNotFound ? (
              <Link
                href={ROUTES.dashboard}
                className="mt-4 inline-flex text-sm font-semibold text-red-900 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
              >
                Return to dashboard
              </Link>
            ) : null}
            {!isUnauthorized && !isForbidden && !isNotFound ? (
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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
    );
  }

  return (
    <div aria-busy={isFetching}>
      {viewerRole === "asprak" ? (
        <AnnouncementComposer userId={userId} courseId={courseId} />
      ) : null}

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Course Stream</h2>
          <p className="mt-1 text-sm text-slate-600">
            {viewerRole === "asprak"
              ? "Pinned updates appear first, followed by the latest announcements."
              : "Read course updates and use comments to ask questions."}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700" aria-live="polite">
          {announcements.length} {announcements.length === 1 ? "announcement" : "announcements"}
        </span>
      </div>

      {isFetching ? (
        <p role="status" className="mt-3 text-sm text-slate-500">
          Refreshing Stream...
        </p>
      ) : null}

      {announcements.length === 0 ? (
        <div role="status" className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <Megaphone className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
          <h3 className="mt-3 font-semibold text-slate-950">No announcements yet</h3>
          <p className="mt-1 text-sm text-slate-600">
            {viewerRole === "asprak"
              ? "Post the first update for this practicum course."
              : "Course announcements will appear here when they are published."}
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {announcements.map((announcement) => (
            viewerRole === "asprak" ? (
              <AnnouncementCard
                key={announcement.id}
                userId={userId}
                courseId={courseId}
                announcement={announcement}
              />
            ) : (
              <PraktikanAnnouncementCard
                key={announcement.id}
                userId={userId}
                courseId={courseId}
                announcement={announcement}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
}
