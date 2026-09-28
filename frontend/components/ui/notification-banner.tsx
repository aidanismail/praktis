"use client";

import { forwardRef, type ReactNode } from "react";
import {
  CheckCircle,
  WarningCircle,
  Warning,
  Info,
  X
} from "@phosphor-icons/react";

export type NotificationVariant = "success" | "error" | "warning" | "info";

export interface NotificationBannerProps {
  variant?: NotificationVariant;
  message?: ReactNode;
  children?: ReactNode;
  onClose?: () => void;
  className?: string;
  tabIndex?: number;
  id?: string;
}

export const NotificationBanner = forwardRef<HTMLDivElement, NotificationBannerProps>(
  function NotificationBanner(
    {
      variant = "success",
      message,
      children,
      onClose,
      className = "",
      tabIndex,
      id,
    },
    ref
  ) {
    const content = message ?? children;
    const isAlert = variant === "error" || variant === "warning";

    return (
      <div
        ref={ref}
        id={id}
        tabIndex={tabIndex}
        role={isAlert ? "alert" : "status"}
        aria-live="polite"
        className={`flex items-center justify-between gap-3 rounded-xl bg-slate-900 border border-slate-200 px-4 py-3 text-xs font-medium text-white shadow-xs animate-in fade-in duration-150 outline-none ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {variant === "success" && (
            <CheckCircle className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
          )}
          {variant === "error" && (
            <WarningCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
          )}
          {variant === "warning" && (
            <Warning className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          )}
          {variant === "info" && (
            <Info className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
          )}
          <div className="leading-relaxed break-words">{content}</div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss notification"
            className="text-slate-400 hover:text-white transition-colors shrink-0 ml-auto p-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);
