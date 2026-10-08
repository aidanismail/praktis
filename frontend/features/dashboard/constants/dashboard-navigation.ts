import type { UserRole } from "@/types/user.type";

export type DashboardNavItem = {
  id: string;
  label: string;
  description: string;
};

export const DASHBOARD_NAVIGATION: Record<UserRole, DashboardNavItem[]> = {
  superadmin: [
    {
      id: "courses",
      label: "Courses",
      description: "Set up practicum offerings, terms, and course staff."
    },
    {
      id: "users",
      label: "User Management",
      description: "Manage student, assistant, and admin accounts."
    },
    {
      id: "bulk-import",
      label: "Import",
      description: "Batch create student accounts."
    },
    {
      id: "modules",
      label: "Module Management",
      description: "Organize lab guides, lecture slides, and references."
    },
    {
      id: "attendance-reports",
      label: "Attendance Reports",
      description: "Track attendance across all active practicum classes."
    },
    {
      id: "grade-exports",
      label: "Grade Exports",
      description: "Export final grades and spreadsheets anytime."
    }
  ],

  asprak: [
    {
      id: "classes",
      label: "Classes",
      description: "Your practicum classes, lab sessions, and rosters."
    },
    {
      id: "modules",
      label: "Module Management",
      description: "Organize lab guides, lecture slides, and references."
    },
    {
      id: "attendance-reports",
      label: "Attendance Reports",
      description: "Track attendance across all active practicum classes."
    },
    {
      id: "grade-exports",
      label: "Grade Exports",
      description: "Export final grades and spreadsheets anytime."
    },
    {
      id: "profile",
      label: "Profile & Security",
      description: "Your assistant identity and password security."
    }
  ],

  praktikan: [
    {
      id: "classes",
      label: "Classes",
      description: "Course materials, assignments, and announcements."
    },
    {
      id: "attendance",
      label: "Attendance",
      description: "Your attendance record across all lab sessions."
    },
    {
      id: "grades",
      label: "Grades",
      description: "Scores and feedback released by your assistants."
    },
    {
      id: "profile",
      label: "Profile",
      description: "Your student identity and password security."
    }
  ]
};
