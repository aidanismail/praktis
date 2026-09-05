"use client";

import Link from "next/link";
import { BookOpen, ClipboardCheck, GraduationCap, History, Layers3, Loader2, MoveRight, RefreshCw } from "lucide-react";
import { getCourseDetailRoute } from "@/constants/routes";
import { useEnrolledCourses } from "../hooks/use-enrolled-courses";
import { PraktikanCourseCard } from "./praktikan-course-card";
import { usePersonalAttendance } from "@/features/attendance/hooks/use-personal-attendance";
import { usePersonalGrades } from "@/features/grades/hooks/use-personal-grades";

type PraktikanCourseOverviewProps = { userId: string; onViewClasses: () => void };

export function PraktikanCourseOverview({ userId, onViewClasses }: PraktikanCourseOverviewProps) {
  const query = useEnrolledCourses(userId);
  const attendanceQuery = usePersonalAttendance(userId);
  const gradesQuery = usePersonalGrades(userId);
  const courses = query.data ?? [];
  const activeCourses = courses.filter((course) => course.is_active);
  const recentCourses = [...activeCourses].sort((a, b) => a.code.localeCompare(b.code)).slice(0, 3);

  if (query.isPending) {
    return <div role="status" className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span className="ml-3 text-sm text-slate-600">Loading your classes...</span></div>;
  }

  if (query.isError) {
    return <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-6"><h1 className="font-semibold text-red-950">Couldn&apos;t load your classes</h1><p className="mt-2 text-sm text-red-800">We ran into a problem fetching your course list. Let&apos;s try that again.</p><button type="button" onClick={() => void query.refetch()} disabled={query.isFetching} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-60"><RefreshCw className="h-4 w-4" aria-hidden="true" />Try again</button></div>;
  }

  const attendanceRows = attendanceQuery.data ?? [];
  const gradeRows = gradesQuery.data ?? [];
  const average = gradeRows.length > 0
    ? gradeRows.reduce((sum, row) => sum + row.score, 0) / gradeRows.length
    : null;

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Student workspace</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Welcome back!</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Here&apos;s what&apos;s happening across your practicum classes.</p>
      </header>
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Enrolled classes", value: courses.length, helper: "All-time enrolled", icon: Layers3 },
          { label: "Active classes", value: activeCourses.length, helper: "This semester", icon: BookOpen },
          { label: "Past classes", value: courses.length - activeCourses.length, helper: "Archived classes", icon: History },
          { label: "Attendance records", value: attendanceQuery.isError ? "—" : attendanceRows.length, helper: attendanceQuery.isError ? "Temporarily unavailable" : "Recorded sessions", icon: ClipboardCheck },
          { label: "Published average", value: gradesQuery.isError || average === null ? "—" : average.toFixed(1), helper: gradesQuery.isError ? "Temporarily unavailable" : "Released session scores", icon: GraduationCap }
        ].map((stat) => <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><dt className="text-sm font-medium text-slate-600">{stat.label}</dt><dd className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{stat.value}</dd></div><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><stat.icon className="h-5 w-5" aria-hidden="true" /></span></div><p className="mt-3 text-xs text-slate-500">{stat.helper}</p></div>)}
      </dl>
      <section aria-labelledby="continue-classes-heading">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="continue-classes-heading" className="text-xl font-semibold text-slate-950">Jump back in</h2><p className="mt-1 text-sm text-slate-600">Your active practicum classes.</p></div><button type="button" onClick={onViewClasses} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700">View all classes <MoveRight className="h-4 w-4" aria-hidden="true" /></button></div>
        {recentCourses.length === 0 ? <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><BookOpen className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" /><h3 className="mt-3 font-semibold text-slate-950">No active classes this term</h3><p className="mt-1 text-sm text-slate-600">Past classes are always available in your archive under My Practicum Classes.</p></div> : <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{recentCourses.map((course) => <Link key={course.id} href={getCourseDetailRoute(course.id)} className="rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"><PraktikanCourseCard course={course} /></Link>)}</div>}
      </section>
    </div>
  );
}
