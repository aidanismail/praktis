"use client";

import { useEffect, useState } from "react";
import { FileText, Download, ExternalLink, X, Loader2 } from "lucide-react";

type DocumentPreviewModalProps = {
  isOpen: boolean;
  title: string;
  courseCode?: string;
  fileUrl: string | null;
  fileExtension?: string;
  onClose: () => void;
};

export function DocumentPreviewModal({
  isOpen,
  title,
  courseCode,
  fileUrl,
  fileExtension = "pdf",
  onClose,
}: DocumentPreviewModalProps) {
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !fileUrl) return null;

  const isPdf =
    fileExtension.toLowerCase() === "pdf" ||
    fileUrl.toLowerCase().includes(".pdf");

  const isFrameLoading = loadedUrl !== fileUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        {/* Top Header Toolbar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
              <FileText className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-xs sm:text-sm font-bold text-slate-900">
                  {title}
                </h3>
                {courseCode && (
                  <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                    {courseCode}
                  </span>
                )}
                <span className="shrink-0 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white uppercase">
                  {fileExtension.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Interactive Document Viewer</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 shadow-xs"
              title="Open in new browser tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </a>

            <a
              href={fileUrl}
              download
              className="flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800"
              title="Download original file"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
              title="Close preview (Esc)"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Document Content Viewport */}
        <div className="relative flex-1 bg-slate-100 overflow-hidden">
          {isFrameLoading && isPdf && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50/90 z-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-700" />
              <span className="text-xs font-medium text-slate-500">Loading document preview...</span>
            </div>
          )}

          {isPdf ? (
            <iframe
              key={fileUrl}
              src={`${fileUrl}#toolbar=1&navpanes=0`}
              title={title}
              onLoad={() => setLoadedUrl(fileUrl)}
              className="h-full w-full border-none bg-white"
            />
          ) : (
            /* Non-PDF fallback reader */
            <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-white">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 mb-4 shadow-xs">
                <FileText className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">{title}</h4>
              <p className="max-w-md text-xs text-slate-500 mb-6">
                This document is a {fileExtension.toUpperCase()} file. You can view it directly in Google Docs / Word or download it.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open via Document Viewer</span>
                </a>
                <a
                  href={fileUrl}
                  download
                  className="rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download File</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
