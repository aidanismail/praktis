"use client";

import { CourseStream } from "@/features/announcements/components/course-stream";
import { CourseAssignments } from "@/features/assignments/components/course-assignments";
import { CourseModules } from "@/features/modules/components/course-modules";
import { CourseSessions } from "@/features/sessions/components/course-sessions";
import type { CourseWorkspaceTab } from "@/constants/routes";
import { CourseRoster } from "./course-roster";
import {
  CourseWorkspaceNavigation,
  getCourseWorkspaceTabIds
} from "./course-workspace-navigation";

type CourseWorkspaceTabsProps = {
  courseId: string;
  initialTab: CourseWorkspaceTab;
  userId: string;
};

const ID_PREFIX = "asprak-course";

export function CourseWorkspaceTabs({
  userId,
  courseId,
  initialTab
}: CourseWorkspaceTabsProps) {
  const streamIds = getCourseWorkspaceTabIds(ID_PREFIX, "stream");
  const moduleIds = getCourseWorkspaceTabIds(ID_PREFIX, "modules");
  const assignmentIds = getCourseWorkspaceTabIds(ID_PREFIX, "assignments");
  const peopleIds = getCourseWorkspaceTabIds(ID_PREFIX, "people");
  const sessionIds = getCourseWorkspaceTabIds(ID_PREFIX, "sessions");

  return (
    <section className="mt-6" aria-label="Course workspace">
      <CourseWorkspaceNavigation
        activeTab={initialTab}
        courseId={courseId}
        idPrefix={ID_PREFIX}
      />

      {initialTab === "stream" ? (
        <div
          id={streamIds.panelId}
          role="tabpanel"
          aria-labelledby={streamIds.tabId}
          className="mt-6 focus:outline-none"
        >
          <CourseStream userId={userId} courseId={courseId} viewerRole="asprak" />
        </div>
      ) : null}

      {initialTab === "modules" ? (
        <div
          id={moduleIds.panelId}
          role="tabpanel"
          aria-labelledby={moduleIds.tabId}
          className="mt-6 focus:outline-none"
        >
          <CourseModules userId={userId} courseId={courseId} accessMode="manage" />
        </div>
      ) : null}

      {initialTab === "assignments" ? (
        <div
          id={assignmentIds.panelId}
          role="tabpanel"
          aria-labelledby={assignmentIds.tabId}
          className="mt-6 focus:outline-none"
        >
          <CourseAssignments
            userId={userId}
            courseId={courseId}
            viewerRole="asprak"
          />
        </div>
      ) : null}

      {initialTab === "people" ? (
        <div
          id={peopleIds.panelId}
          role="tabpanel"
          aria-labelledby={peopleIds.tabId}
          className="mt-6 focus:outline-none"
        >
          <CourseRoster userId={userId} courseId={courseId} />
        </div>
      ) : null}

      {initialTab === "sessions" ? (
        <div
          id={sessionIds.panelId}
          role="tabpanel"
          aria-labelledby={sessionIds.tabId}
          className="mt-6 focus:outline-none"
        >
          <CourseSessions userId={userId} courseId={courseId} />
        </div>
      ) : null}
    </section>
  );
}
