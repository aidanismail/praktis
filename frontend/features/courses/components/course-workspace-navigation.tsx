"use client";

import {
  BookOpen,
  ClipboardList,
  MessageSquareText,
  Radio,
  Users,
  type LucideIcon
} from "lucide-react";
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

type CourseWorkspaceTabItem = {
  icon: LucideIcon;
  label: string;
};

const COURSE_WORKSPACE_TAB_ITEMS: Record<
  CourseWorkspaceTab,
  CourseWorkspaceTabItem
> = {
  stream: { icon: MessageSquareText, label: "Stream" },
  modules: { icon: BookOpen, label: "Modules" },
  assignments: { icon: ClipboardList, label: "Assignments" },
  people: { icon: Users, label: "People" },
  sessions: { icon: Radio, label: "Sessions & Attendance" }
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
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
      <div
        role="tablist"
        aria-label="Course sections"
        className="flex min-w-max gap-1"
      >
        {COURSE_WORKSPACE_TABS.map((tab) => {
          const { icon: Icon, label } = COURSE_WORKSPACE_TAB_ITEMS[tab];
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
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                isActive
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
