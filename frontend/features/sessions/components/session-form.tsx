"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import {
  sessionFormSchema,
  type SessionFormValues
} from "../schemas/session.schema";

type SessionFormProps = {
  defaultValues?: SessionFormValues;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  error: Error | null;
  onSubmit: (values: SessionFormValues) => Promise<boolean>;
  onCancel?: () => void;
  resetAfterSubmit?: boolean;
  autoFocusTitle?: boolean;
  compact?: boolean;
};

const emptyValues: SessionFormValues = {
  title: "",
  date: ""
};

function getSessionFormError(error: Error | null) {
  if (!error) {
    return null;
  }

  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Your session expired. Sign in again before saving.";
    }

    if (error.status === 403) {
      return "You don't have permission to manage sessions for this course.";
    }

    if (error.status === 404) {
      return "Couldn't find this course or session. Try refreshing the page.";
    }

    if (error.status === 422) {
      return "Check your session details. Make sure the title and date look right.";
    }
  }

  return "Couldn't save this session. Please check your connection and try again.";
}

export function SessionForm({
  defaultValues = emptyValues,
  submitLabel,
  pendingLabel,
  isPending,
  error,
  onSubmit,
  onCancel,
  resetAfterSubmit = false,
  autoFocusTitle = false,
  compact = false
}: SessionFormProps) {
  const generatedId = useId();
  const titleId = `session-title-${generatedId}`;
  const dateId = `session-date-${generatedId}`;
  const formError = getSessionFormError(error);

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues
  });

  async function submit(values: SessionFormValues) {
    const succeeded = await onSubmit(values);

    if (succeeded && resetAfterSubmit) {
      form.reset(emptyValues);
    }
  }

  const inputCls = compact
    ? "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
    : "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100";

  const labelCls = compact
    ? "text-xs font-semibold text-slate-700"
    : "text-sm font-semibold text-slate-800";

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate className={compact ? "space-y-3" : "space-y-4"}>
      <div className={compact ? "space-y-3" : "grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]"}>
        <div className={compact ? "space-y-1" : ""}>
          <label
            htmlFor={titleId}
            className={labelCls}
          >
            Session title
          </label>
          <input
            id={titleId}
            type="text"
            maxLength={255}
            autoFocus={autoFocusTitle}
            disabled={isPending}
            aria-invalid={Boolean(form.formState.errors.title)}
            aria-describedby={
              form.formState.errors.title ? `${titleId}-error` : undefined
            }
            {...form.register("title")}
            className={inputCls}
            placeholder="e.g. Session 1: Getting Started"
          />
          {form.formState.errors.title ? (
            <p
              id={`${titleId}-error`}
              role="alert"
              className="mt-1 text-xs text-red-700"
            >
              {form.formState.errors.title.message}
            </p>
          ) : null}
        </div>

        <div className={compact ? "space-y-1" : ""}>
          <label
            htmlFor={dateId}
            className={labelCls}
          >
            Session date
          </label>
          <input
            id={dateId}
            type="date"
            disabled={isPending}
            aria-invalid={Boolean(form.formState.errors.date)}
            aria-describedby={
              form.formState.errors.date ? `${dateId}-error` : undefined
            }
            {...form.register("date")}
            className={inputCls}
          />
          {form.formState.errors.date ? (
            <p
              id={`${dateId}-error`}
              role="alert"
              className="mt-1 text-xs text-red-700"
            >
              {form.formState.errors.date.message}
            </p>
          ) : null}
        </div>
      </div>

      {formError ? (
        <p role="alert" className="text-xs text-red-700">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="apple-press inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-xs"
          >
            Cancel
          </button>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="apple-press inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60 shadow-xs"
        >
          {isPending ? (
            <AsteriskLoader className="h-3.5 w-3.5" />
          ) : null}
          {isPending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
