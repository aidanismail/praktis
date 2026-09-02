"use client";

import { CourseStream } from "@/features/announcements/components/course-stream";
import { CourseAssignments } from "@/features/assignments/components/course-assignments";
import { PraktikanCourseAttendance } from "@/features/attendance/components/praktikan-course-attendance";
import { PraktikanCourseGrades } from "@/features/grades/components/praktikan-course-grades";
import { CourseModules } from "@/features/modules/components/course-modules";
import type { CourseWorkspaceTab } from "@/constants/routes";
import type { User } from "@/types/user.type";
import {
  CourseWorkspaceNavigation,
  getCourseWorkspaceTabIds
} from "./course-workspace-navigation";
import { PraktikanCourseMembership } from "./praktikan-course-membership";

type PraktikanCourseWorkspaceTabsProps = {
  courseId: string;
  initialTab: CourseWorkspaceTab;
  user: User;
};

const ID_PREFIX = "praktikan-course";

export function PraktikanCourseWorkspaceTabs({
  user,
  courseId,
  initialTab
}: PraktikanCourseWorkspaceTabsProps) {
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
          <CourseStream
            userId={user.id}
            courseId={courseId}
            viewerRole="praktikan"
          />
        </div>
      ) : null}

      {initialTab === "modules" ? (
        <div
          id={moduleIds.panelId}
          role="tabpanel"
          aria-labelledby={moduleIds.tabId}
          className="mt-6 focus:outline-none"
        >
          <CourseModules
            userId={user.id}
            courseId={courseId}
            accessMode="read-only"
          />
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
            userId={user.id}
            courseId={courseId}
            viewerRole="praktikan"
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
          <PraktikanCourseMembership user={user} />
        </div>
      ) : null}

      {initialTab === "sessions" ? (
        <div
          id={sessionIds.panelId}
          role="tabpanel"
          aria-labelledby={sessionIds.tabId}
          className="mt-6 space-y-10 focus:outline-none"
        >
          <PraktikanCourseAttendance userId={user.id} courseId={courseId} />
          <PraktikanCourseGrades userId={user.id} courseId={courseId} />
        </div>
      ) : null}
    </section>
  );
}
