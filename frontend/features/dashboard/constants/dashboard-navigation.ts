import type { UserRole } from "@/types/user.type";

export type DashboardNavItem = {
  id: string;
  label: string;
  description: string;
};

export const DASHBOARD_NAVIGATION: Record<UserRole, DashboardNavItem[]> = {
  superadmin: [
    {
      id: "overview",
      label: "Overview",
      description: "Course offerings, account coverage, and platform readiness."
    },
    {
      id: "courses",
      label: "Course Management",
      description: "Create and manage practicum courses and academic periods."
    },
    {
      id: "users",
      label: "User Management",
      description: "Manage praktikan, asprak, and admin accounts."
    },
    {
      id: "bulk-import",
      label: "Bulk Import",
      description: "Import student accounts from CSV files."
    },
    {
      id: "modules",
      label: "Module Management",
      description: "Manage practicum modules and learning files."
    },
    {
      id: "attendance-reports",
      label: "Attendance Reports",
      description: "Monitor attendance records across practicum classes."
    },
    {
      id: "grade-exports",
      label: "Grade Exports",
      description: "Export grading data to XLSX or CSV."
    }
  ],

  asprak: [
    {
      id: "overview",
      label: "Overview",
      description: "Summary of assigned practicum classes."
    },
    {
      id: "classes",
      label: "My Practicum Classes",
      description: "View assigned classes and practicum groups."
    }
  ],

  praktikan: [
    {
      id: "overview",
      label: "Overview",
      description: "Summary of your practicum progress."
    },
    {
      id: "classes",
      label: "My Practicum Classes",
      description: "Open enrolled classes, modules, and assignments."
    },
    {
      id: "attendance",
      label: "Attendance Status",
      description: "View your attendance history."
    },
    {
      id: "grades",
      label: "Grades",
      description: "View released practicum scores."
    },
    {
      id: "profile",
      label: "Profile",
      description: "View your account and practicum identity."
    }
  ]
};
