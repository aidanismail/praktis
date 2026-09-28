"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useAssignedCourses } from "../hooks/use-assigned-courses";
import type { Course } from "../types/course.type";
import { AsprakCourseCard } from "./asprak-course-card";
import { sortCourses } from "../utils/sort-courses";
import {
  WarningCircle,
  ArrowsClockwise
} from "@phosphor-icons/react";

type AsprakCourseOverviewProps = {
  userId: string;
  onNavigateToCourse?: (courseId: string) => void;
};

type CourseStatProps = {
  label: string;
  value: number;
  helper: string;
};

function CourseStat({ label, value, helper }: CourseStatProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function CourseOverviewLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-8">
      <span className="sr-only">Loading your classes...</span>
      <div className="grid gap-4 sm:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2" aria-hidden="true">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
    </div>
  );
}

export function AsprakCourseOverview({
  userId,
  onNavigateToCourse
}: AsprakCourseOverviewProps) {
  const {
    data: courses = [],
    error,
    isError,
    isFetching,
    isPending,
    refetch
  } = useAssignedCourses(userId);

  const activeCourses = useMemo(
    () => sortCourses(courses.filter((course) => course.is_active)),
    [courses]
  );
  const historicalCount = useMemo(
    () => courses.filter((course) => !course.is_active).length,
    [courses]
  );
  const visibleCourses = useMemo(
    () => activeCourses.slice(0, 4),
    [activeCourses]
  );
  const remainingCount = Math.max(0, activeCourses.length - visibleCourses.length);

  if (isPending) {
    return <CourseOverviewLoading />;
  }

  if (isError) {
    const isUnauthorized = error instanceof ApiError && error.status === 401;
    const isForbidden = error instanceof ApiError && error.status === 403;

    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 p-6"
      >
        <div className="flex items-start gap-3">
          <WarningCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
            aria-hidden="true"
          />

          <div>
            <h3 className="font-semibold text-red-950">
              {isUnauthorized
                ? "You've been signed out"
                : isForbidden
                  ? "Access restricted"
                  : "Unable to load overview"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-red-800">
              {isUnauthorized
                ? "Please sign in again to view your assigned classes."
                : isForbidden
                  ? "You do not have instructor access to these classes. Please contact an administrator."
                  : "Unable to reach the server. Please check your connection and try again."}
            </p>

            {isUnauthorized ? (
              <Link
                href={ROUTES.login}
                className="mt-4 inline-flex rounded-xl bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
              >
                Go to sign in
              </Link>
            ) : null}

            {!isUnauthorized && !isForbidden ? (
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowsClockwise
                  className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
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
    <div className="space-y-8">
      <section aria-labelledby="class-metrics-heading">
        <div className="flex items-center justify-between">
          <h3
            id="class-metrics-heading"
            className="text-lg font-semibold text-slate-950"
          >
            Assigned classes
          </h3>

          {/* Persistent aria-live region so screen readers announce refresh state */}
          <span
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500"
          >
            {isFetching ? (
              <>
                <ArrowsClockwise
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
                Refreshing
              </>
            ) : null}
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <CourseStat
            label="Total"
            value={courses.length}
            helper="All time"
          />
          <CourseStat
            label="Active"
            value={activeCourses.length}
            helper="Current term"
          />
          <CourseStat
            label="Past"
            value={historicalCount}
            helper="Completed terms"
          />
        </div>
      </section>

      <section aria-labelledby="active-course-heading">
        <h3
          id="active-course-heading"
          className="text-lg font-semibold text-slate-950"
        >
          Recent classes
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Select a class to view announcements, modules, assignments, and sessions.
        </p>

        {visibleCourses.length > 0 ? (
          <>
            <ul className="mt-4 grid gap-4 lg:grid-cols-2">
              {visibleCourses.map((course: Course) => (
                <li key={course.id}>
                  <button
                    type="button"
                    onClick={() => onNavigateToCourse?.(course.id)}
                    className="block h-full w-full rounded-2xl text-left transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                    aria-label={`Open ${course.code} ${course.name}, ${course.academic_year} semester ${course.semester}`}
                  >
                    <AsprakCourseCard course={course} />
                  </button>
                </li>
              ))}
            </ul>
            {remainingCount > 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                {remainingCount} more active{" "}
                {remainingCount === 1 ? "class" : "classes"} in My Practicum Classes.
              </p>
            ) : null}
          </>
        ) : (
          <div
            role="status"
            className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"
          >
            <h4 className="font-semibold text-slate-950">
              No active classes right now
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              You can review completed terms under My Practicum Classes.
            </p>
            <button
              type="button"
              onClick={() => onNavigateToCourse && onNavigateToCourse("")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Browse all classes
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
