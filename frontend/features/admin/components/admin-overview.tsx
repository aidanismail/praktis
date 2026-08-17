"use client";

import { useEffect, useState } from "react";
import { ChevronRight, ArrowUpRight, BookOpen, Users, FileText, Activity, RefreshCw } from "lucide-react";
import {
  fetchAdminCourses,
  fetchAdminModules,
  fetchAdminUsers,
  fetchSystemHealth,
  type SystemHealthStatus,
} from "../api/admin.api";
import type { Course } from "@/features/courses/types/course.type";
import type { AdminModuleItem } from "../types/admin.type";
import type { User } from "@/types/user.type";
import {
  getThemeConfig,
  getPatternConfig,
  loadSavedCourseTheme,
  getDeterministicThemeId,
} from "@/features/courses/constants/banner-themes";

type AdminOverviewProps = {
  onNavigateToCourse?: (courseId: string) => void;
  onNavigateToNavItem?: (itemId: string) => void;
};

export function AdminOverview({
  onNavigateToCourse,
  onNavigateToNavItem,
}: AdminOverviewProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<AdminModuleItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const data = await fetchSystemHealth();
      setHealth(data);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [cData, mData, uData, hData] = await Promise.all([
          fetchAdminCourses().catch(() => []),
          fetchAdminModules().catch(() => []),
          fetchAdminUsers().catch(() => []),
          fetchSystemHealth(),
        ]);
        setCourses(cData);
        setModules(mData);
        setUsers(uData);
        setHealth(hData);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const activeCourses = courses.filter((c) => c.is_active);
  const publishedModules = modules.filter((m) => m.is_published);
  const totalStudents = users.filter((u) => u.role === "praktikan").length;
  const totalStaff = users.filter((u) => u.role === "asprak").length;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-white">
              Informatics Practicum Management
            </h3>
            <p className="mt-1 text-xs text-slate-300 max-w-xl">
              Supervising active lab course offerings, learning materials, and student rosters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                !health || health.status === "ok"
                  ? "bg-emerald-400"
                  : health.status === "degraded"
                    ? "bg-amber-400"
                    : "bg-rose-400"
              } animate-pulse`}
            />
            <span className="text-xs font-semibold text-slate-200">
              {health?.status === "ok"
                ? "FastAPI & PostgreSQL Operational"
                : health?.status === "degraded"
                  ? "System Degraded"
                  : health?.status === "down"
                    ? "System Unreachable"
                    : "Connecting Services..."}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stat Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Courses (Clickable -> Course Management) */}
        <div
          onClick={() => onNavigateToNavItem?.("courses")}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs apple-card-hover apple-press cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-700" />
                <span>Course Offerings</span>
              </p>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {isLoading ? "—" : courses.length}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200">
                {activeCourses.length} Active
              </span>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400 group-hover:text-slate-600 transition-colors">
            Click to manage courses & rosters →
          </p>
        </div>

        {/* Card 2: Users (Clickable -> User Management) */}
        <div
          onClick={() => onNavigateToNavItem?.("users")}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs apple-card-hover apple-press cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-700" />
                <span>User Accounts</span>
              </p>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {isLoading ? "—" : users.length}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {totalStudents} Students
              </span>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400 group-hover:text-slate-600 transition-colors">
            {totalStaff} Teaching Assistants assigned →
          </p>
        </div>

        {/* Card 3: Modules (Clickable -> Module Management) */}
        <div
          onClick={() => onNavigateToNavItem?.("modules")}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs apple-card-hover apple-press cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-700" />
                <span>Learning Modules</span>
              </p>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {isLoading ? "—" : modules.length}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                {publishedModules.length} Published
              </span>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400 group-hover:text-slate-600 transition-colors">
            Manage files & storage →
          </p>
        </div>

        {/* Card 4: System Health (Live Real-Time Status) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-700" />
                <span>Platform Status</span>
              </p>
              <button
                type="button"
                onClick={checkHealth}
                disabled={isCheckingHealth}
                title="Refresh system health status"
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? "animate-spin text-slate-900" : ""}`} />
              </button>
            </div>

            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    !health
                      ? "bg-slate-300 animate-pulse"
                      : health.status === "ok"
                        ? "bg-emerald-500 shadow-xs shadow-emerald-500/50"
                        : health.status === "degraded"
                          ? "bg-amber-500 shadow-xs shadow-amber-500/50"
                          : "bg-rose-500 shadow-xs shadow-rose-500/50"
                  }`}
                />
                <span className="text-sm font-bold text-slate-900">
                  {!health
                    ? "Checking..."
                    : health.status === "ok"
                      ? "Operational"
                      : health.status === "degraded"
                        ? "Degraded"
                        : "Unreachable"}
                </span>
              </div>
            </div>
              {health && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    health.status === "ok"
                      ? "text-emerald-800"
                      : health.status === "degraded"
                        ? "text-amber-800"
                        : "text-rose-800"
                  }`}
                >
                  {health.status === "ok"
                    ? "All Systems Normal"
                    : health.status === "degraded"
                      ? "Needs Attention"
                      : "Offline"}
                </span>
              )}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {health?.db_connected
                ? "PostgreSQL Connected"
                : health?.status === "down"
                  ? "Backend Unreachable"
                  : "DB Disconnected"}
            </span>
            {health?.latency_ms !== undefined && (
              <span className="text-[10px] font-mono font-medium text-slate-400">
                {health.latency_ms}ms
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recent Course Cards (Linked to Course Workspace) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Practicum Courses</h4>
            <p className="text-xs text-slate-500">Click any card to open the classroom workspace</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToNavItem?.("courses")}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors"
          >
            <span>View All ({courses.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 shadow-xs">
            Loading course offerings...
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 shadow-xs">
            No courses registered in the database yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const cTheme = loadSavedCourseTheme(course.id, course.code);
              const themeCfg = getThemeConfig(cTheme.themeId || getDeterministicThemeId(course.code));
              const patternCfg = getPatternConfig(cTheme.patternId);

              return (
                <div
                  key={course.id}
                  onClick={() => onNavigateToCourse?.(course.id)}
                  className="group rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between"
                >
                  <div className={`${!cTheme.imageUrl ? themeCfg.gradientClass : "bg-slate-900"} text-white p-5 relative overflow-hidden`}>
                    {cTheme.imageUrl && (
                      <>
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${cTheme.imageUrl})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/70" />
                      </>
                    )}
                    {patternCfg.id !== "none" && (
                      <div className={`absolute inset-0 pointer-events-none ${patternCfg.overlayClass}`} />
                    )}
                    <div className="relative z-10">
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span className={`font-semibold ${themeCfg.badgeBg} px-2 py-0.5 rounded text-[10px] uppercase tracking-wider backdrop-blur-xs`}>
                          {course.code}
                        </span>
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] text-slate-200 border border-white/10 backdrop-blur-xs">
                          {course.semester} {course.academic_year}
                        </span>
                      </div>
                      <h5 className="mt-2.5 text-sm font-bold text-white group-hover:underline line-clamp-1 drop-shadow-xs">
                        {course.name}
                      </h5>
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-between text-xs text-slate-600 bg-white">
                    <span className="font-semibold text-slate-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Open Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-800 border border-slate-200">
                      Active Term
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
