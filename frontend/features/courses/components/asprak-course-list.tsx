"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";
import { getCourseDetailRoute, ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useAssignedCourses } from "../hooks/use-assigned-courses";
import type { Course } from "../types/course.type";
import { AsprakCourseCard } from "./asprak-course-card";
import { sortCourses } from "../utils/sort-courses";

type AsprakCourseListProps = {
  userId: string;
  onNavigateToCourse?: (courseId: string) => void;
};

type CourseGroupProps = {
  id: string;
  title: string;
  description: string;
  courses: Course[];
  onNavigateToCourse?: (courseId: string) => void;
};

function CourseGroup({
  id,
  title,
  description,
  courses,
  onNavigateToCourse
}: CourseGroupProps) {
  if (courses.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={id}>
      <div>
        <h3 id={id} className="text-lg font-semibold text-slate-950">
          {title}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <ul className="mt-4 grid gap-4 lg:grid-cols-2">
        {courses.map((course) => (
          <li key={course.id}>
            <Link
              href={getCourseDetailRoute(course.id)}
              onClick={(e) => {
                if (onNavigateToCourse) {
                  e.preventDefault();
                  onNavigateToCourse(course.id);
                }
              }}
              aria-label={`Open ${course.code} ${course.name}, ${course.academic_year} semester ${course.semester}`}
              className="block h-full rounded-2xl transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              <AsprakCourseCard course={course} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CourseListLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading your classes...</span>

      <div className="grid gap-4 lg:grid-cols-2" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
    </div>
  );
}

export function AsprakCourseList({
  userId,
  onNavigateToCourse
}: AsprakCourseListProps) {
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
  const historicalCourses = useMemo(
    () => sortCourses(courses.filter((course) => !course.is_active)),
    [courses]
  );

  if (isPending) {
    return <CourseListLoading />;
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
                  : "Unable to load classes"}
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
        <h3 className="font-semibold text-slate-950">
          No classes assigned yet
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Your account does not have any classes assigned for this term yet. Please contact an administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CourseGroup
        id="active-practicum-classes"
        title="Active classes"
        description="Classes currently in session."
        courses={activeCourses}
        onNavigateToCourse={onNavigateToCourse}
      />

      <CourseGroup
        id="historical-practicum-classes"
        title="Past classes"
        description="Previous course terms kept for records and reference."
        courses={historicalCourses}
        onNavigateToCourse={onNavigateToCourse}
      />
    </div>
  );
}
