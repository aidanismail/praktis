"use client";

import { useRouter } from "next/navigation";
import { useRef, type KeyboardEvent } from "react";
import {
  COURSE_WORKSPACE_TABS,
  getCourseDetailRoute,
  type CourseWorkspaceTab
} from "@/constants/routes";

type CourseWorkspaceNavigationProps = {
  activeTab: CourseWorkspaceTab;
  courseId: string;
  idPrefix: string;
};

const COURSE_WORKSPACE_TAB_LABELS: Record<CourseWorkspaceTab, string> = {
  stream: "Stream",
  modules: "Modules",
  assignments: "Assignments",
  people: "People",
  sessions: "Sessions & Attendance"
};

export function getCourseWorkspaceTabIds(
  idPrefix: string,
  tab: CourseWorkspaceTab
) {
  return {
    panelId: `${idPrefix}-panel-${tab}`,
    tabId: `${idPrefix}-tab-${tab}`
  };
}

export function CourseWorkspaceNavigation({
  activeTab,
  courseId,
  idPrefix
}: CourseWorkspaceNavigationProps) {
  const router = useRouter();
  const tabRefs = useRef<
    Record<CourseWorkspaceTab, HTMLButtonElement | null>
  >({
    stream: null,
    modules: null,
    assignments: null,
    people: null,
    sessions: null
  });

  function activateTab(tab: CourseWorkspaceTab, shouldFocus = false) {
    router.replace(getCourseDetailRoute(courseId, tab), { scroll: false });

    if (shouldFocus) {
      requestAnimationFrame(() => tabRefs.current[tab]?.focus());
    }
  }

  function onTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentTab: CourseWorkspaceTab
  ) {
    const currentIndex = COURSE_WORKSPACE_TABS.indexOf(currentTab);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % COURSE_WORKSPACE_TABS.length;
    }

    if (event.key === "ArrowLeft") {
      nextIndex =
        (currentIndex - 1 + COURSE_WORKSPACE_TABS.length) %
        COURSE_WORKSPACE_TABS.length;
    }

    if (event.key === "Home") {
      nextIndex = 0;
    }

    if (event.key === "End") {
      nextIndex = COURSE_WORKSPACE_TABS.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      activateTab(COURSE_WORKSPACE_TABS[nextIndex], true);
    }
  }

  return (
    <div className="border-b border-slate-200 overflow-x-auto">
      <div
        role="tablist"
        aria-label="Course sections"
        className="flex min-w-max gap-2"
      >
        {COURSE_WORKSPACE_TABS.map((tab) => {
          const label = COURSE_WORKSPACE_TAB_LABELS[tab];
          const { panelId, tabId } = getCourseWorkspaceTabIds(idPrefix, tab);
          const isActive = tab === activeTab;

          return (
            <button
              key={tab}
              ref={(node) => {
                tabRefs.current[tab] = node;
              }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => activateTab(tab)}
              onKeyDown={(event) => onTabKeyDown(event, tab)}
<<<<<<< HEAD
              className={`inline-flex items-center py-3 px-3.5 text-sm font-semibold border-b-2 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 -mb-px cursor-pointer ${
                isActive
                  ? "border-slate-950 text-slate-950"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
=======
              className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-xs font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
