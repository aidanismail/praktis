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
      description: "System summary and latest practicum activity."
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
    },
    {
      id: "settings",
      label: "System Settings",
      description: "Configure system-level settings."
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
    },
    {
      id: "modules",
      label: "Modules",
      description: "Upload and manage practicum materials."
    },
    {
      id: "attendance",
      label: "Attendance",
      description:
        "Mark student attendance as present, sick, excused, or absent."
    },
    {
      id: "grading",
      label: "Grading",
      description: "Input and manage practicum scores."
    },
    {
      id: "reports",
      label: "Reports",
      description: "Review class progress and export records."
    }
  ],

  praktikan: [
    {
      id: "overview",
      label: "Overview",
      description: "Summary of your practicum progress."
    },
    {
      id: "modules",
      label: "My Modules",
      description: "Access practicum modules and files."
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
