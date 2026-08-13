import type { User } from "@/types/user.type";
import type { DashboardNavItem } from "../constants/dashboard-navigation";
import { DashboardPlaceholderCard } from "./dashboard-placeholder-card";
import { DashboardStatCard } from "./dashboard-stat-card";
import { AsprakCourseList } from "@/features/courses/components/asprak-course-list";

type RoleDashboardProps = {
  user: User;
  activeItem: DashboardNavItem;
};

const ROLE_COPY = {
  superadmin: {
    title: "System Control Center",
    description:
      "Central workspace for managing users, modules, attendance records, grades, and system-wide practicum operations.",
    stats: [
      {
        label: "Registered Users",
        value: "—",
        helper: "Placeholder for total active accounts."
      },
      {
        label: "Practicum Classes",
        value: "—",
        helper: "Placeholder for managed classes."
      },
      {
        label: "Uploaded Modules",
        value: "—",
        helper: "Placeholder for available module files."
      }
    ]
  },

  asprak: {
    title: "Assistant Workspace",
    description:
      "Workspace for managing assigned practicum classes, uploading modules, recording attendance, and inputting grades.",
    stats: [
      {
        label: "Assigned Classes",
        value: "—",
        helper: "Placeholder for asprak class assignments."
      },
      {
        label: "Attendance Sessions",
        value: "—",
        helper: "Placeholder for attendance records."
      },
      {
        label: "Pending Grades",
        value: "—",
        helper: "Placeholder for unfinished grading tasks."
      }
    ]
  },

  praktikan: {
    title: "Student Practicum Portal",
    description:
      "Personal dashboard for accessing practicum modules, attendance status, grades, and account information.",
    stats: [
      {
        label: "Available Modules",
        value: "—",
        helper: "Placeholder for accessible materials."
      },
      {
        label: "Attendance Rate",
        value: "—",
        helper: "Placeholder for attendance percentage."
      },
      {
        label: "Released Grades",
        value: "—",
        helper: "Placeholder for published scores."
      }
    ]
  }
};

export function RoleDashboard({ user, activeItem }: RoleDashboardProps) {
  const roleContent = ROLE_COPY[user.role];

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-sm font-medium text-emerald-600">
          {activeItem.label}
        </p>

        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          {roleContent.title}
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          {roleContent.description}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {roleContent.stats.map((stat) => (
          <DashboardStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            helper={stat.helper}
          />
        ))}
      </div>
      {user.role === "asprak" && activeItem.id === "classes" ? (
        <AsprakCourseList userId={user.id}></AsprakCourseList>
      ) : (
        <DashboardPlaceholderCard
          title={activeItem.label}
          description={activeItem.description}
        />
      )}
    </section>
  );
}
