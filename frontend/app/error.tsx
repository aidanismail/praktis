"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client rendering exception for diagnostic observability
    console.error("Global runtime error caught by boundary:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div
        role="alert"
        aria-live="assertive"
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-base font-bold text-slate-900">
            Something went sideways
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            An unexpected hiccup occurred while loading this page. Give it another shot or head back to your dashboard.
          </p>
          {error.message && (
            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 font-mono text-left overflow-x-auto max-h-24">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href={ROUTES.dashboard}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

