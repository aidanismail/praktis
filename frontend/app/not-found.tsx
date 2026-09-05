import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mx-auto shadow-xs">
          <FileQuestion className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Error 404
          </span>
          <h1 className="text-lg font-bold text-slate-900">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            We looked everywhere, but couldn&apos;t find this page. It might have been moved, deleted, or you might have an outdated link.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href={ROUTES.dashboard}
            className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold shadow-xs transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Take Me Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

