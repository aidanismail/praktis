"use client";

import { useEffect } from "react";
import "./globals.css";

const isDev = process.env.NODE_ENV !== "production";

export default function RootGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error caught by global boundary:", error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6">
          <div
            role="alert"
            className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl sm:p-8"
          >
            <h1 className="text-base font-bold text-slate-900">
              Something went wrong
            </h1>
            <p className="text-xs leading-relaxed text-slate-500">
              Praktis hit an unexpected problem and couldn&apos;t load. Try
              again, or reload the page.
            </p>
            {(isDev ? error.message : error.digest) && (
              <p className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left font-mono text-[11px] text-slate-600">
                {isDev ? error.message : `Error reference: ${error.digest}`}
              </p>
            )}
            <div className="flex flex-col items-center justify-center gap-2.5 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={() => reset()}
                className="w-full cursor-pointer rounded-full bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800 sm:w-auto"
              >
                Try again
              </button>
              {/* A plain anchor on purpose: a full reload resets all client state. */}
              <a
                href="/dashboard"
                className="w-full rounded-full bg-slate-100 px-5 py-2.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-200 sm:w-auto"
              >
                Return to dashboard
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
