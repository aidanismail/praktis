"use client";

import { BookOpen, MessageSquareText, Radio, Users } from "lucide-react";
import { useRef, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { CourseStream } from "@/features/announcements/components/course-stream";
import { CourseClasswork } from "@/features/assignments/components/course-classwork";
import { PraktikanCourseAttendance } from "@/features/attendance/components/praktikan-course-attendance";
import { PraktikanCourseGrades } from "@/features/grades/components/praktikan-course-grades";
import { CourseModules } from "@/features/modules/components/course-modules";
import { COURSE_WORKSPACE_TABS, getCourseDetailRoute, type CourseWorkspaceTab } from "@/constants/routes";
import type { User } from "@/types/user.type";
import { PraktikanCourseMembership } from "./praktikan-course-membership";

type Props = { user: User; courseId: string; initialTab: CourseWorkspaceTab };
const icons = { stream: MessageSquareText, classwork: BookOpen, people: Users, sessions: Radio };
const labels = { stream: "Stream", classwork: "Classwork", people: "People", sessions: "Sessions & Attendance" };

export function PraktikanCourseWorkspaceTabs({ user, courseId, initialTab }: Props) {
  const router = useRouter();
  const refs = useRef<Record<CourseWorkspaceTab, HTMLButtonElement | null>>({ stream: null, classwork: null, people: null, sessions: null });
  function activate(tab: CourseWorkspaceTab, focus = false) { router.replace(getCourseDetailRoute(courseId, tab), { scroll: false }); if (focus) requestAnimationFrame(() => refs.current[tab]?.focus()); }
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, tab: CourseWorkspaceTab) { const index = COURSE_WORKSPACE_TABS.indexOf(tab); let next: number | null = null; if (event.key === "ArrowRight") next = (index + 1) % COURSE_WORKSPACE_TABS.length; if (event.key === "ArrowLeft") next = (index - 1 + COURSE_WORKSPACE_TABS.length) % COURSE_WORKSPACE_TABS.length; if (event.key === "Home") next = 0; if (event.key === "End") next = COURSE_WORKSPACE_TABS.length - 1; if (next !== null) { event.preventDefault(); activate(COURSE_WORKSPACE_TABS[next], true); } }
  return <section className="mt-6" aria-label="Course workspace"><div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm"><div role="tablist" aria-label="Course sections" className="flex min-w-max gap-1">{COURSE_WORKSPACE_TABS.map((tab) => { const Icon = icons[tab]; const active = tab === initialTab; return <button key={tab} ref={(node) => { refs.current[tab] = node; }} id={`praktikan-course-tab-${tab}`} type="button" role="tab" aria-selected={active} aria-controls={`praktikan-course-panel-${tab}`} tabIndex={active ? 0 : -1} onClick={() => activate(tab)} onKeyDown={(event) => onKeyDown(event, tab)} className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${active ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}><Icon className="h-4 w-4" aria-hidden="true" />{labels[tab]}</button>; })}</div></div>
    {initialTab === "stream" ? <div id="praktikan-course-panel-stream" role="tabpanel" aria-labelledby="praktikan-course-tab-stream" className="mt-6"><CourseStream userId={user.id} courseId={courseId} viewerRole="praktikan" /></div> : null}
    {initialTab === "classwork" ? <div id="praktikan-course-panel-classwork" role="tabpanel" aria-labelledby="praktikan-course-tab-classwork" className="mt-6 space-y-10"><CourseModules userId={user.id} courseId={courseId} accessMode="read-only" /><CourseClasswork userId={user.id} courseId={courseId} viewerRole="praktikan" /></div> : null}
    {initialTab === "people" ? <div id="praktikan-course-panel-people" role="tabpanel" aria-labelledby="praktikan-course-tab-people"><PraktikanCourseMembership user={user} /></div> : null}
    {initialTab === "sessions" ? <div id="praktikan-course-panel-sessions" role="tabpanel" aria-labelledby="praktikan-course-tab-sessions" className="mt-6 space-y-10"><PraktikanCourseAttendance userId={user.id} courseId={courseId} /><PraktikanCourseGrades userId={user.id} courseId={courseId} /></div> : null}
  </section>;
}
