"use client";

import {
  LayoutDashboard,
  BookOpen,
  Users,
  UploadCloud,
  FileText,
  ClipboardCheck,
  GraduationCap,
  FileSpreadsheet,
  LogOut,
  Loader2,
  Layers,
  X
} from "lucide-react";
import type { DashboardNavItem } from "../constants/dashboard-navigation";

type DashboardSidebarProps = {
  items: DashboardNavItem[];
  activeItemId: string;
  onSelectItem: (id: string) => void;
  onLogout: () => void;
  isLoggingOut?: boolean;
  hasLogoutError?: boolean;
  isCollapsed?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
};

const NAV_ICONS: Record<string, React.ElementType> = {
  overview: LayoutDashboard,
  courses: BookOpen,
  classes: BookOpen,
  users: Users,
  "bulk-import": UploadCloud,
  modules: FileText,
  "attendance-reports": ClipboardCheck,
  attendance: ClipboardCheck,
  grades: GraduationCap,
  "grade-exports": FileSpreadsheet,
  profile: Users
};

export function DashboardSidebar({
  items,
  activeItemId,
  onSelectItem,
  onLogout,
  isLoggingOut = false,
  hasLogoutError = false,
  isCollapsed = false,
  isMobileOpen = false,
  onCloseMobile
}: DashboardSidebarProps) {
  const renderNavButtons = (collapsed: boolean, isMobileView: boolean) => (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3 pt-4">
      {items.map((item) => {
        const isActive = item.id === activeItemId;
        const IconComponent = NAV_ICONS[item.id] || Layers;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onSelectItem(item.id);
              if (isMobileView) onCloseMobile?.();
            }}
            title={collapsed ? item.label : undefined}
            className={`w-full rounded-2xl apple-press transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center ${
              collapsed
                ? "h-11 justify-center px-0"
                : "px-4 py-3 justify-between text-xs font-semibold"
            } ${
              isActive
                ? "bg-slate-900 text-white font-bold shadow-xs scale-[1.01]"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <IconComponent className="h-4 w-4 shrink-0 transition-transform duration-200" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </div>

            {!collapsed && isActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-white shrink-0 animate-in fade-in zoom-in duration-200" />
            )}
          </button>
        );
      })}
    </nav>
  );

  const renderFooter = (collapsed: boolean) => {
    const logoutLabel = isLoggingOut
      ? "Signing Out..."
      : hasLogoutError
        ? "Retry Sign Out"
        : "Sign Out";

    return (
      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          aria-describedby={hasLogoutError ? "logout-error-message" : undefined}
          title={collapsed ? logoutLabel : undefined}
          className={`flex w-full items-center rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] apple-press hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 ${
            collapsed
              ? "h-11 justify-center px-0"
              : "justify-center gap-2 px-4 py-2.5"
          }`}
        >
          {isLoggingOut ? (
            <Loader2
              className="h-4 w-4 shrink-0 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}

          {!collapsed ? <span aria-live="polite">{logoutLabel}</span> : null}
        </button>
      </div>
    );
  };

  return (
    <>
      {/* 1. Mobile Off-Canvas Drawer (< md) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
          />

          {/* Drawer Panel */}
          <aside className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-left duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]">
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5 font-bold text-slate-900">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white shadow-xs">
                  P
                </div>
                <span className="text-base tracking-tight">Praktis</span>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center apple-press transition-colors"
                aria-label="Close Navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Body */}
            {renderNavButtons(false, true)}

            {/* Footer */}
            {renderFooter(false)}
          </aside>
        </div>
      )}

      {/* 2. Desktop Standard Sticky Sidebar (>= md) */}
      <aside
        className={`sticky top-16 hidden md:flex h-[calc(100vh-4rem)] shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-30 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {renderNavButtons(isCollapsed, false)}
        {renderFooter(isCollapsed)}
      </aside>
    </>
  );
}
