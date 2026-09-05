"use client";

import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  History,
  Layers3,
  RefreshCw
} from "lucide-react";
import { getCourseDetailRoute, ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useAssignedCourses } from "../hooks/use-assigned-courses";
import type { Course } from "../types/course.type";
import { AsprakCourseCard } from "./asprak-course-card";

type AsprakCourseOverviewProps = {
  userId: string;
};

type CourseStatProps = {
  label: string;
  value: number;
  helper: string;
  icon: typeof BookOpen;
};

function sortCourses(courses: Course[]) {
  return [...courses].sort((first, second) => {
    const yearComparison = second.academic_year.localeCompare(
      first.academic_year
    );

    return yearComparison !== 0
      ? yearComparison
      : first.code.localeCompare(second.code);
  });
}

function CourseStat({ label, value, helper, icon: Icon }: CourseStatProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function CourseOverviewLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-8">
      <span className="sr-only">Getting your classes ready...</span>
      <div className="grid gap-4 sm:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
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
  userId
}: AsprakCourseOverviewProps) {
  const {
    data: courses = [],
    error,
    isError,
    isFetching,
    isPending,
    refetch
  } = useAssignedCourses(userId);

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
          <AlertCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
            aria-hidden="true"
          />
          <div>
            <h3 className="font-semibold text-red-950">
              {isUnauthorized
                ? "You've been signed out"
                : isForbidden
                  ? "Access restricted"
                  : "Couldn't load your teaching overview"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-red-800">
              {isUnauthorized
                ? "Please sign in again to continue."
                : isForbidden
                  ? "You don't have instructor access to these classes yet. Check in with your admin."
                  : "Couldn't reach the server. Let's try that again."}
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
                <RefreshCw
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

  if (courses.length === 0) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"
      >
        <BookOpen
          className="mx-auto h-8 w-8 text-slate-400"
          aria-hidden="true"
        />
        <h3 className="mt-4 font-semibold text-slate-950">
          No classes assigned yet
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          When an administrator assigns you to lead or assist a class, it&apos;ll appear right here.
        </p>
      </div>
    );
  }

  const activeCourses = sortCourses(
    courses.filter((course) => course.is_active)
  );
  const historicalCount = courses.length - activeCourses.length;
  const visibleCourses = activeCourses.slice(0, 4);
  const remainingCount = activeCourses.length - visibleCourses.length;

  return (
    <div className="space-y-8">
      <section aria-labelledby="course-summary-heading">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3
              id="course-summary-heading"
              className="text-lg font-semibold text-slate-950"
            >
              Overview
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              A quick snapshot of your active and past teaching assignments.
            </p>
          </div>
          {isFetching ? (
            <span
              role="status"
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-500"
            >
              <RefreshCw
                className="h-3.5 w-3.5 animate-spin"
                aria-hidden="true"
              />
              Refreshing
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <CourseStat
            label="Assigned classes"
            value={courses.length}
            helper="All time"
            icon={Layers3}
          />
          <CourseStat
            label="Active classes"
            value={activeCourses.length}
            helper="Current term"
            icon={BookOpen}
          />
          <CourseStat
            label="Historical classes"
            value={historicalCount}
            helper="Past terms"
            icon={History}
          />
        </div>
      </section>

      <section aria-labelledby="active-course-heading">
        <h3
          id="active-course-heading"
          className="text-lg font-semibold text-slate-950"
        >
          Jump back in
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Select a class to manage announcements, modules, assignments, and sessions.
        </p>

        {visibleCourses.length > 0 ? (
          <>
            <ul className="mt-4 grid gap-4 lg:grid-cols-2">
              {visibleCourses.map((course) => (
                <li key={course.id}>
                  <Link
                    href={getCourseDetailRoute(course.id)}
                    aria-label={`Open ${course.code} ${course.name}, ${course.academic_year} semester ${course.semester}`}
                    className="block h-full rounded-2xl transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                  >
                    <AsprakCourseCard course={course} />
                  </Link>
                </li>
              ))}
            </ul>
            {remainingCount > 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                {remainingCount} more active{" "}
                {remainingCount === 1 ? "class" : "classes"} waiting in My
                Classes.
              </p>
            ) : null}
          </>
        ) : (
          <div
            role="status"
            className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6"
          >
            <h4 className="font-semibold text-slate-950">
              No active classes right now
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              You can still review previous terms under My Classes.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
