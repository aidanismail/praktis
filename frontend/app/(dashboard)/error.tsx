"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error boundary caught exception:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div
        role="alert"
        aria-live="assertive"
        className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">
            Couldn&apos;t load this section
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Something tripped up while loading this part of your dashboard. Your session is safe—try reloading or head to overview.
          </p>
          {error.message && (
            <p className="text-[11px] text-slate-400 font-mono bg-slate-50 p-2 rounded-xl border border-slate-100 mt-2 overflow-x-auto">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href={ROUTES.dashboard}
            className="w-full sm:w-auto px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

