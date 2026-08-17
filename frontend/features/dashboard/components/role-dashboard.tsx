import type { User } from "@/types/user.type";
import type { DashboardNavItem } from "../constants/dashboard-navigation";
import { DashboardPlaceholderCard } from "./dashboard-placeholder-card";
import { AsprakCourseList } from "@/features/courses/components/asprak-course-list";
import { AdminOverview } from "@/features/admin/components/admin-overview";
import { UserManagement } from "@/features/admin/components/user-management";
import { BulkImportForm } from "@/features/admin/components/bulk-import-form";
import { AdminModuleList } from "@/features/admin/components/admin-module-list";
import { AttendanceReportsView } from "@/features/admin/components/attendance-reports-view";
import { GradeExportsView } from "@/features/admin/components/grade-exports-view";
import { CourseManagement } from "@/features/admin/components/course-management";

type RoleDashboardProps = {
  user: User;
  activeItem: DashboardNavItem;
  onNavigateToCourse?: (courseId: string) => void;
  onNavigateToNavItem?: (itemId: string) => void;
};

export function RoleDashboard({
  user,
  activeItem,
  onNavigateToCourse,
  onNavigateToNavItem,
}: RoleDashboardProps) {
  const renderContent = () => {
    if (user.role === "superadmin") {
      switch (activeItem.id) {
        case "overview":
          return (
            <AdminOverview
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

    if (user.role === "asprak" && activeItem.id === "classes") {
      return <AsprakCourseList userId={user.id} />;
    }

    return (
      <DashboardPlaceholderCard
        title={activeItem.label}
        description={activeItem.description}
      />
    );
  };

  return (
    <section className="space-y-6 max-w-7xl mx-auto">
      {renderContent()}
    </section>
  );
}
