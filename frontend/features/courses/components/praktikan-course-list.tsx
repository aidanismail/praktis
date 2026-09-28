"use client";

import Link from "next/link";
<<<<<<< HEAD
import { AlertCircle, Grid2X2, List, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
=======
import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import { useState, useMemo } from "react";
>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
import { getCourseDetailRoute, ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { useEnrolledCourses } from "../hooks/use-enrolled-courses";
import type { Course } from "../types/course.type";
import { PraktikanCourseCard } from "./praktikan-course-card";
import { PraktikanCourseTable } from "./praktikan-course-table";
import {
  BookOpen,
  SquaresFour,
  ListBullets,
  ArrowsClockwise,
  MagnifyingGlass
} from "@phosphor-icons/react";

type PraktikanCourseListProps = {
  userId: string;
  onNavigateToCourse?: (courseId: string) => void;
};
type ViewMode = "grid" | "table";

function sortCourses(courses: Course[]) {
  return [...courses].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    const period = b.academic_year.localeCompare(a.academic_year);
    return period || a.code.localeCompare(b.code);
  });
}

export function PraktikanCourseList({
  userId,
  onNavigateToCourse
}: PraktikanCourseListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const query = useEnrolledCourses(userId);
  const allCourses = useMemo(() => sortCourses(query.data ?? []), [query.data]);
  const status = query.error instanceof ApiError ? query.error.status : null;

<<<<<<< HEAD
  if (query.isPending) {
    return (
      <div role="status" className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span className="ml-3 text-sm text-slate-600">Loading your practicum classes...</span>
      </div>
    );
  }
=======
  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allCourses;
    return allCourses.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.academic_year.toLowerCase().includes(q) ||
        String(c.semester).toLowerCase().includes(q)
    );
  }, [allCourses, searchQuery]);
>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe

  if (query.isPending) {
    return (
<<<<<<< HEAD
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
        <h2 className="mt-3 text-lg font-semibold text-red-950">Couldn&apos;t load your classes</h2>
        <p className="mt-1 text-sm leading-6 text-red-800">{status === 401 ? "You've been signed out. Sign in again to continue." : status === 403 ? "You don't have access to this class list." : "Couldn't reach the server. Let's try that again."}</p>
        {status === 401 ? (
          <Link href={ROUTES.login} className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-red-700 px-4 text-sm font-semibold text-white">Sign in</Link>
        ) : (
          <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-60">
            <RefreshCw className={query.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />Try again
          </button>
        )}
=======
      <div
        role="status"
        className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white"
      >
        <AsteriskLoader className="h-5 w-5 text-slate-400" aria-hidden="true" />
        <span className="ml-3 text-xs font-medium text-slate-600">Loading your practicum classes...</span>
>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
      </div>
    );
  }

<<<<<<< HEAD
  return (
    <div aria-busy={query.isFetching}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Enrolled academic periods</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">My Practicum Classes</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Browse your active classes or revisit coursework from past semesters.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" aria-label="Course display" role="group">
            <button type="button" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-slate-900 cursor-pointer ${viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}><Grid2X2 className="h-3.5 w-3.5" aria-hidden="true" />Grid</button>
            <button type="button" aria-pressed={viewMode === "table"} onClick={() => setViewMode("table")} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-slate-900 cursor-pointer ${viewMode === "table" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}><List className="h-3.5 w-3.5" aria-hidden="true" />Table</button>
          </div>
          <button type="button" aria-label="Refresh classes" onClick={() => void query.refetch()} disabled={query.isFetching} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer">
            <RefreshCw className={query.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} aria-hidden="true" />
=======
  if (query.isError) {
    return (
      <NotificationBanner variant="error">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div>
            <h3 className="font-semibold text-white">Couldn&apos;t load your classes</h3>
            <p className="mt-0.5 text-xs text-slate-300">
              {status === 401
                ? "You've been signed out. Sign in again to continue."
                : status === 403
                  ? "You don't have access to this class list."
                  : "Couldn't reach the server. Let's try that again."}
            </p>
          </div>
          {status === 401 ? (
            <Link
              href={ROUTES.login}
              className="inline-flex rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 shrink-0"
            >
              Sign in
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition disabled:opacity-60 shrink-0"
            >
              <ArrowsClockwise className={query.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} aria-hidden="true" />
              Try again
            </button>
          )}
        </div>
      </NotificationBanner>
    );
  }

  return (
    <div className="space-y-5" aria-busy={query.isFetching}>
      {/* Action Bar & Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search your classes by code, name, or year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
            />
            <MagnifyingGlass className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center bg-white border border-slate-200 rounded-full p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Grid View"
              aria-pressed={viewMode === "grid"}
            >
              <SquaresFour className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Table View"
              aria-pressed={viewMode === "table"}
            >
              <ListBullets className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            aria-label="Refresh classes"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            title="Refresh classes"
          >
            <ArrowsClockwise className={`w-3.5 h-3.5 ${query.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
          </button>
        </div>
      </div>

<<<<<<< HEAD
      {courses.length === 0 ? (
        <div role="status" className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="text-base font-semibold text-slate-950">No enrolled classes yet</h2>
          <p className="mt-1 text-sm text-slate-600">Once you&apos;re enrolled in a practicum class, it&apos;ll show up right here.</p>
        </div>
      ) : viewMode === "table" ? (
        <div className="mt-4"><PraktikanCourseTable courses={courses} /></div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={getCourseDetailRoute(course.id)} className="rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900">
=======
      {allCourses.length === 0 ? (
        <div
          role="status"
          className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs"
        >
          <BookOpen className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 text-sm font-bold text-slate-950">No enrolled classes yet</h2>
          <p className="mt-1 text-xs text-slate-500">
            Once you&apos;re enrolled in a practicum class, it will show up right here.
          </p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-xs">
          No classes match your search.
        </div>
      ) : viewMode === "table" ? (
        <PraktikanCourseTable
          courses={filteredCourses}
          onNavigateToCourse={onNavigateToCourse}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <Link
              key={course.id}
              href={getCourseDetailRoute(course.id)}
              onClick={(e) => {
                if (onNavigateToCourse) {
                  e.preventDefault();
                  onNavigateToCourse(course.id);
                }
              }}
              className="rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 block h-full"
            >
>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
              <PraktikanCourseCard course={course} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
