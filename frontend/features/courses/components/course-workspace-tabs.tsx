"use client";

import { BookOpen, MessageSquareText, Radio, Users } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import { CourseStream } from "@/features/announcements/components/course-stream";
import { CourseRoster } from "./course-roster";

type CourseWorkspaceTabsProps = {
  userId: string;
  courseId: string;
};

type ActiveWorkspaceTab = "stream" | "people";

const enabledTabs: ActiveWorkspaceTab[] = ["stream", "people"];

export function CourseWorkspaceTabs({ userId, courseId }: CourseWorkspaceTabsProps) {
  const [activeTab, setActiveTab] = useState<ActiveWorkspaceTab>("stream");
  const tabRefs = useRef<Record<ActiveWorkspaceTab, HTMLButtonElement | null>>({
    stream: null,
    people: null
  });

  function selectTab(tab: ActiveWorkspaceTab) {
    setActiveTab(tab);
    tabRefs.current[tab]?.focus();
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentTab: ActiveWorkspaceTab) {
    const currentIndex = enabledTabs.indexOf(currentTab);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % enabledTabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = enabledTabs.length - 1;

    if (nextIndex !== null) {
      event.preventDefault();
      selectTab(enabledTabs[nextIndex]);
    }
  }

  const activeClass = "border-emerald-600 bg-emerald-50 text-emerald-800";
  const idleClass = "border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950";
  const tabClass = "inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";

  return (
    <section className="mt-6" aria-label="Course workspace">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <div role="tablist" aria-label="Course sections" className="flex min-w-max gap-1">
          <button
            ref={(node) => { tabRefs.current.stream = node; }}
            id="course-tab-stream"
            type="button"
            role="tab"
            aria-selected={activeTab === "stream"}
            aria-controls="course-panel-stream"
            tabIndex={activeTab === "stream" ? 0 : -1}
            onClick={() => setActiveTab("stream")}
            onKeyDown={(event) => onTabKeyDown(event, "stream")}
            className={`${tabClass} ${activeTab === "stream" ? activeClass : idleClass}`}
          >
            <MessageSquareText className="h-4 w-4" aria-hidden="true" />
            Stream
          </button>

          <button type="button" role="tab" aria-selected="false" aria-disabled="true" disabled className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-xl border border-transparent px-4 text-sm font-semibold text-slate-400">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Classwork
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">Later</span>
          </button>

          <button
            ref={(node) => { tabRefs.current.people = node; }}
            id="course-tab-people"
            type="button"
            role="tab"
            aria-selected={activeTab === "people"}
            aria-controls="course-panel-people"
            tabIndex={activeTab === "people" ? 0 : -1}
            onClick={() => setActiveTab("people")}
            onKeyDown={(event) => onTabKeyDown(event, "people")}
            className={`${tabClass} ${activeTab === "people" ? activeClass : idleClass}`}
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            People
          </button>

          <button type="button" role="tab" aria-selected="false" aria-disabled="true" disabled className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-xl border border-transparent px-4 text-sm font-semibold text-slate-400">
            <Radio className="h-4 w-4" aria-hidden="true" />
            Sessions & Attendance
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">Later</span>
          </button>
        </div>
      </div>

      {activeTab === "stream" ? (
        <div id="course-panel-stream" role="tabpanel" aria-labelledby="course-tab-stream" className="mt-6 focus:outline-none">
          <CourseStream userId={userId} courseId={courseId} />
        </div>
      ) : null}

      {activeTab === "people" ? (
        <div id="course-panel-people" role="tabpanel" aria-labelledby="course-tab-people" className="focus:outline-none">
          <CourseRoster userId={userId} courseId={courseId} />
        </div>
      ) : null}
    </section>
  );
}
