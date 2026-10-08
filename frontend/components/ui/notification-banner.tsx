"use client";

import { forwardRef, type ReactNode } from "react";
import {
  CheckCircleIcon,
  WarningCircleIcon,
  WarningIcon,
  InfoIcon,
  XIcon
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

const VARIANT_STYLES: Record<NotificationVariant, string> = {
  success: "bg-emerald-950 border-emerald-800",
  error: "bg-rose-950 border-rose-800",
  warning: "bg-amber-950 border-amber-800",
  info: "bg-sky-950 border-sky-800"
};

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
        aria-live={isAlert ? undefined : "polite"}
        className={`flex items-center justify-between gap-3 rounded-xl border ${VARIANT_STYLES[variant]} px-4 py-3 text-xs font-medium text-white shadow-xs animate-in fade-in duration-150 outline-none ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {variant === "success" && (
            <CheckCircleIcon className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
          )}
          {variant === "error" && (
            <WarningCircleIcon className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
          )}
          {variant === "warning" && (
            <WarningIcon className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          )}
          {variant === "info" && (
            <InfoIcon className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
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
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);
