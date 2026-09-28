"use client";

import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "../schemas/assignment.schema";
import {
  ASSIGNMENT_FILE_TYPES,
  type AssignmentFileType
} from "../types/assignment.type";

type AssignmentFormFieldsProps = {
  form: UseFormReturn<AssignmentFormValues>;
  idPrefix: string;
  disabled: boolean;
  compact?: boolean;
};

const fileTypeLabels: Record<AssignmentFileType, string> = {
  pdf: "PDF",
  zip: "ZIP",
  docx: "DOCX"
};

export function AssignmentFormFields({
  form,
  idPrefix,
  disabled,
  compact = false
}: AssignmentFormFieldsProps) {
  const titleId = `${idPrefix}-title`;
  const descriptionId = `${idPrefix}-description`;
  const dueDateId = `${idPrefix}-due-date`;
  const maxPointsId = `${idPrefix}-max-points`;
  const fileTypesHelpId = `${idPrefix}-file-types-help`;
  const fileTypesErrorId = `${idPrefix}-file-types-error`;
  const publicationId = `${idPrefix}-published`;

  const inputCls = compact
    ? "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
    : "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50";

  const labelCls = compact
    ? "text-xs font-semibold text-slate-700"
    : "text-sm font-medium text-slate-800";

  return (
    <>
      <div className={compact ? "space-y-1.5" : "space-y-2"}>
        <label htmlFor={titleId} className={labelCls}>
          Title
        </label>
        <input
          id={titleId}
          type="text"
          maxLength={255}
          disabled={disabled}
          placeholder="e.g. Lab Exercise 01"
          aria-invalid={Boolean(form.formState.errors.title)}
          aria-describedby={
            form.formState.errors.title ? `${titleId}-error` : undefined
          }
          className={inputCls}
          {...form.register("title")}
        />

        {form.formState.errors.title ? (
          <p id={`${titleId}-error`} className="text-xs text-red-600">
            {form.formState.errors.title.message}
          </p>
        ) : null}
      </div>

      <div className={compact ? "space-y-1.5" : "space-y-2"}>
        <label htmlFor={descriptionId} className={labelCls}>
          Instructions
          <span className="ml-1 font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id={descriptionId}
          rows={compact ? 3 : 5}
          disabled={disabled}
          placeholder="Brief task description and submission rules..."
          className={
            compact
              ? "w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              : "w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          }
          {...form.register("description")}
        />
      </div>

      <div className={`grid gap-3 ${compact ? "grid-cols-1 sm:grid-cols-2" : "sm:grid-cols-2"}`}>
        <div className={compact ? "space-y-1.5" : "space-y-2"}>
          <label htmlFor={dueDateId} className={labelCls}>
            Due date
            <span className="ml-1 font-normal text-slate-400">(optional)</span>
          </label>

          <input
            id={dueDateId}
            type="datetime-local"
            disabled={disabled}
            aria-invalid={Boolean(form.formState.errors.due_date)}
            aria-describedby={
              form.formState.errors.due_date ? `${dueDateId}-error` : undefined
            }
            className={inputCls}
            {...form.register("due_date")}
          />
          {form.formState.errors.due_date ? (
            <p id={`${dueDateId}-error`} className="text-xs text-red-600">
              {form.formState.errors.due_date.message}
            </p>
          ) : null}
        </div>

        <div className={compact ? "space-y-1.5" : "space-y-2"}>
          <label htmlFor={maxPointsId} className={labelCls}>
            Max points
          </label>

          <input
            id={maxPointsId}
            type="number"
            min={1}
            max={1000}
            step={1}
            disabled={disabled}
            aria-invalid={Boolean(form.formState.errors.max_points)}
            aria-describedby={
              form.formState.errors.max_points
                ? `${maxPointsId}-error`
                : undefined
            }
            className={inputCls}
            {...form.register("max_points", {
              valueAsNumber: true
            })}
          />
          {form.formState.errors.max_points ? (
            <p id={`${maxPointsId}-error`} className="text-xs text-red-600">
              {form.formState.errors.max_points.message}
            </p>
          ) : null}
        </div>
      </div>

      <fieldset
        aria-describedby={
          form.formState.errors.allowed_file_types
            ? fileTypesErrorId
            : fileTypesHelpId
        }
        className={compact ? "space-y-2" : "space-y-3"}
      >
        <legend className={labelCls}>Allowed formats</legend>

        <div className="flex flex-wrap gap-2">
          {ASSIGNMENT_FILE_TYPES.map((fileType) => (
            <label
              key={fileType}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 ${
                compact ? "px-2.5 py-1.5 text-xs" : "min-h-11 px-4 text-sm"
              }`}
            >
              <input
                type="checkbox"
                value={fileType}
                disabled={disabled}
                className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 accent-slate-900"
                {...form.register("allowed_file_types")}
              />
              <span className="font-semibold text-slate-800">
                {fileTypeLabels[fileType]}
              </span>
            </label>
          ))}
        </div>

        {form.formState.errors.allowed_file_types ? (
          <p id={fileTypesErrorId} className="text-xs text-red-600">
            {form.formState.errors.allowed_file_types.message}
          </p>
        ) : null}
      </fieldset>

      <div
        className={`border border-slate-200 bg-slate-50/70 ${
          compact ? "rounded-xl p-3" : "rounded-2xl p-4"
        }`}
      >
        <label
          htmlFor={publicationId}
          className="inline-flex cursor-pointer items-start gap-2.5"
        >
          <input
            id={publicationId}
            type="checkbox"
            disabled={disabled}
            className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-slate-900 accent-slate-900"
            {...form.register("is_published")}
          />
          <span>
            <span
              className={`block font-semibold text-slate-900 ${
                compact ? "text-xs" : "text-sm font-medium text-slate-800"
              }`}
            >
              Publish immediately
            </span>
            <span
              className={`block text-slate-500 ${
                compact ? "text-[11px] leading-4" : "mt-0.5 text-xs leading-5"
              }`}
            >
              Leave unchecked to save as a draft.
            </span>
          </span>
        </label>
      </div>
    </>
  );
}
