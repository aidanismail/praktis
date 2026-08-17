"use client";

import Link from "next/link";
import { AlertCircle, BookOpen, RefreshCw } from "lucide-react";
import { getCourseDetailRoute, ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useAssignedCourses } from "../hooks/use-assigned-courses";
import type { Course } from "../types/course.type";
import { AsprakCourseCard } from "./asprak-course-card";

type AsprakCourseListProps = {
  userId: string;
};

type CourseGroupProps = {
  id: string;
  title: string;
  description: string;
  courses: Course[];
};

function sortCourses(courses: Course[]) {
  return [...courses].sort((first, second) => {
    const yearComparison = second.academic_year.localeCompare(
      first.academic_year
    );

    if (yearComparison !== 0) {
      return yearComparison;
    }

    return first.code.localeCompare(second.code);
  });
}

function CourseGroup({ id, title, description, courses }: CourseGroupProps) {
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
              aria-label={`Open ${course.code} ${course.name},
  ${course.academic_year} semester ${course.semester}`}
              className="block h-full rounded-2xl transition
  hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
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
      <span className="sr-only">Loading assigned practicum classes...</span>

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

export function AsprakCourseList({ userId }: AsprakCourseListProps) {
  const {
    data: courses = [],
    error,
    isError,
    isFetching,
    isPending,
    refetch
  } = useAssignedCourses(userId);

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
                ? "Your session has expired"
                : isForbidden
                  ? "Course access is unavailable"
                  : "Assigned classes could not be loaded"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-red-800">
              {isUnauthorized
                ? "Sign in again to continue to your assigned practicum classes."
                : isForbidden
                  ? "Your account does not currently have access to this course list. Ask an administrator to verify your role and assignments."
                  : "A network or server problem interrupted the request. You can try again."}
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
          No assigned practicum classes
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Your account has no assigned course offering yet. Ask a Superadmin to
          verify your current academic-period assignment.
        </p>
      </div>
    );
  }

  const activeCourses = sortCourses(
    courses.filter((course) => course.is_active)
  );
  const historicalCourses = sortCourses(
    courses.filter((course) => !course.is_active)
  );

  return (
    <div className="space-y-8">
      <CourseGroup
        id="active-practicum-classes"
        title="Active practicum classes"
        description="Course offerings currently available for practicum work."
        courses={activeCourses}
      />

      <CourseGroup
        id="historical-practicum-classes"
        title="Historical practicum classes"
        description="Previous academic-period assignments retained for reference."
        courses={historicalCourses}
      />
    </div>
  );
}
