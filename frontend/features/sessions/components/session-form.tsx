"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
      return "You are not allowed to manage sessions for this course.";
    }

    if (error.status === 404) {
      return "The course or session could not be found. Refresh before retrying.";
    }

    if (error.status === 422) {
      return "The session details were rejected. Review the title and date.";
    }
  }

  return "The session could not be saved because of a network or server problem.";
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
  autoFocusTitle = false
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

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <div>
          <label
            htmlFor={titleId}
            className="text-sm font-semibold text-slate-800"
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
            className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="e.g. Meeting 1: Introduction"
          />
          {form.formState.errors.title ? (
            <p
              id={`${titleId}-error`}
              role="alert"
              className="mt-1 text-sm text-red-700"
            >
              {form.formState.errors.title.message}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={dateId}
            className="text-sm font-semibold text-slate-800"
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
            className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          {form.formState.errors.date ? (
            <p
              id={`${dateId}-error`}
              role="alert"
              className="mt-1 text-sm text-red-700"
            >
              {form.formState.errors.date.message}
            </p>
          ) : null}
        </div>
      </div>

      {formError ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          {isPending ? pendingLabel : submitLabel}
        </button>

        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
