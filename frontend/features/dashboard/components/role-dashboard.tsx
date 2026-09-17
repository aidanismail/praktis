import type { User } from "@/types/user.type";
import type { Course } from "@/features/courses/types/course.type";
import type { DashboardNavItem } from "../constants/dashboard-navigation";
import { DashboardPlaceholderCard } from "./dashboard-placeholder-card";
import { AsprakCourseList } from "@/features/courses/components/asprak-course-list";
import { AsprakCourseOverview } from "@/features/courses/components/asprak-course-overview";
import {
  AsprakCourseWorkspace,
  type AsprakWorkspaceTab
} from "@/features/courses/components/asprak-course-workspace";
import { AdminOverview } from "@/features/admin/components/admin-overview";
import { UserManagement } from "@/features/admin/components/user-management";
import { BulkImportForm } from "@/features/admin/components/bulk-import-form";
import { AdminModuleList } from "@/features/admin/components/admin-module-list";
import { AttendanceReportsView } from "@/features/admin/components/attendance-reports-view";
import { GradeExportsView } from "@/features/admin/components/grade-exports-view";
import { CourseManagement } from "@/features/admin/components/course-management";
import { PraktikanCourseList } from "@/features/courses/components/praktikan-course-list";
import { PraktikanAttendanceHistory } from "@/features/attendance/components/praktikan-attendance-history";
import { PraktikanGradeHistory } from "@/features/grades/components/praktikan-grade-history";
import { UserProfile } from "@/features/profile/components/user-profile";

type RoleDashboardProps = {
  user: User;
  activeItem: DashboardNavItem;
  onNavigateToCourse: (courseId: string) => void;
  onNavigateToNavItem: (itemId: string) => void;
  activeCourse?: Course | null;
  workspaceTab?: string;
  assignmentId?: string | null;
  sessionId?: string | null;
};

export function RoleDashboard({
  user,
  activeItem,
  onNavigateToCourse,
  onNavigateToNavItem,
  activeCourse,
  workspaceTab,
  assignmentId,
  sessionId
}: RoleDashboardProps) {
  const renderContent = () => {
    if (user.role === "superadmin") {
      switch (activeItem.id) {
        case "overview":
          return (
            <AdminOverview
              userId={user.id}
              onNavigateToCourse={onNavigateToCourse}
              onNavigateToNavItem={onNavigateToNavItem}
            />
          );
        case "courses":
          return <CourseManagement />;
        case "users":
          return <UserManagement />;
        case "bulk-import":
          return <BulkImportForm />;
        case "modules":
          return <AdminModuleList />;
        case "attendance-reports":
          return <AttendanceReportsView />;
        case "grade-exports":
          return <GradeExportsView />;
        default:
          return (
            <DashboardPlaceholderCard
              title={activeItem.label}
              description={activeItem.description}
            />
          );
      }
    }

    if (user.role === "asprak") {
      if (activeItem.id === "overview") {
        return (
          <AsprakCourseOverview
            userId={user.id}
            onNavigateToCourse={onNavigateToCourse}
          />
        );
      }

      if (activeItem.id === "classes") {
        if (activeCourse) {
          return (
            <AsprakCourseWorkspace
              userId={user.id}
              course={activeCourse}
              workspaceTab={
                (workspaceTab as AsprakWorkspaceTab) || "stream"
              }
              assignmentId={assignmentId}
              sessionId={sessionId}
            />
          );
        }
        return (
          <AsprakCourseList
            userId={user.id}
            onNavigateToCourse={onNavigateToCourse}
          />
        );
      }

      if (activeItem.id === "profile") {
        return <UserProfile user={user} />;
      }
    }

    if (user.role === "praktikan") {
      if (activeItem.id === "classes") {
        return <PraktikanCourseList userId={user.id} />;
      }

      if (activeItem.id === "attendance") {
        return <PraktikanAttendanceHistory userId={user.id} />;
      }

      if (activeItem.id === "grades") {
        return <PraktikanGradeHistory userId={user.id} />;
      }

      if (activeItem.id === "profile") {
        return <UserProfile user={user} />;
      }
    }

    return (
      <DashboardPlaceholderCard
        title={activeItem.label}
        description={activeItem.description}
      />
    );
  };

  return <>{renderContent()}</>;
}
