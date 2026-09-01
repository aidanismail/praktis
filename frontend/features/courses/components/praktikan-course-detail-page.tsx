"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, CalendarDays, Loader2, RefreshCw } from "lucide-react";
import { ROUTES, type CourseWorkspaceTab } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { getDeterministicThemeId, getThemeConfig } from "../constants/banner-themes";
import { useEnrolledCourses } from "../hooks/use-enrolled-courses";
import { PraktikanCourseWorkspaceTabs } from "./praktikan-course-workspace-tabs";

type Props = { courseId: string; initialTab: CourseWorkspaceTab };
function Frame({ children }: { children: React.ReactNode }) { return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">{children}</div></main>; }

export function PraktikanCourseDetailPage({ courseId, initialTab }: Props) {
  const user = useAuthStore((state) => state.user);
  const query = useEnrolledCourses(user?.role === "praktikan" ? user.id : "");
  if (!user) return null;
  if (user.role !== "praktikan") return <Frame><div role="alert" className="rounded-3xl border border-amber-200 bg-amber-50 p-6"><h1 className="font-semibold text-amber-950">Praktikan access required</h1><Link href={ROUTES.dashboard} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-amber-900 underline">Return to dashboard</Link></div></Frame>;
  if (query.isPending) return <Frame><div role="status" className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span className="ml-3 text-sm text-slate-600">Checking your course enrollment...</span></div></Frame>;
  if (query.isError) { const status = query.error instanceof ApiError ? query.error.status : null; return <Frame><div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-6"><AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" /><h1 className="mt-3 font-semibold text-red-950">Course details could not be loaded</h1><p className="mt-2 text-sm text-red-800">{status === 401 ? "Your session has expired." : status === 403 ? "Your account cannot access this course list." : "A network or server problem interrupted the request."}</p>{status === null || ![401, 403].includes(status) ? <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-60"><RefreshCw className="h-4 w-4" aria-hidden="true" />Try again</button> : <Link href={status === 401 ? ROUTES.login : ROUTES.dashboard} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-red-900 underline">{status === 401 ? "Go to sign in" : "Return to dashboard"}</Link>}</div></Frame>; }
  const course = (query.data ?? []).find((item) => item.id === courseId);
  if (!course) return <Frame><div role="alert" className="rounded-3xl border border-amber-200 bg-amber-50 p-6"><h1 className="font-semibold text-amber-950">Course is unavailable</h1><p className="mt-2 text-sm text-amber-800">This course is not part of your enrolled practicum classes.</p><Link href={ROUTES.dashboard} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-amber-900 underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Return to dashboard</Link></div></Frame>;
  const theme = getThemeConfig(getDeterministicThemeId(course.code));
  return <Frame><Link href={ROUTES.dashboard} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to dashboard</Link><header className={`relative mt-5 overflow-hidden rounded-3xl p-6 text-white shadow-sm sm:p-8 ${theme.gradientClass}`}><div className="relative z-10 flex flex-wrap items-start justify-between gap-4"><div><span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${theme.badgeBg}`}>{course.code}</span><h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{course.name}</h1></div><span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">{course.is_active ? "Active offering" : "Historical offering"}</span></div><div className="relative z-10 mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/20 pt-5 text-sm text-white/85"><span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" aria-hidden="true" />Academic year {course.academic_year}</span><span>Semester {course.semester}</span></div></header><PraktikanCourseWorkspaceTabs user={user} courseId={courseId} initialTab={initialTab} /></Frame>;
}
