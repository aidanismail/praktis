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
};

const fileTypeLabels: Record<AssignmentFileType, string> = {
  pdf: "PDF",
  zip: "ZIP",
  docx: "DOCX"
};

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 disabled:cursor-not-allowed disabled:bg-slate-50";

export function AssignmentFormFields({
  form,
  idPrefix,
  disabled
}: AssignmentFormFieldsProps) {
  const titleId = `${idPrefix}-title`;
  const descriptionId = `${idPrefix}-description`;
  const dueDateId = `${idPrefix}-due-date`;
  const maxPointsId = `${idPrefix}-max-points`;
  const fileTypesHelpId = `${idPrefix}-file-types-help`;
  const fileTypesErrorId = `${idPrefix}-file-types-error`;
  const publicationId = `${idPrefix}-published`;

  return (
    <>
      <div className="space-y-2">
        <label htmlFor={titleId} className="text-sm font-medium text-slate-800">
          Title
        </label>
        <input
          id={titleId}
          type="text"
          maxLength={255}
          disabled={disabled}
          placeholder="Example: Linked List Implementation"
          aria-invalid={Boolean(form.formState.errors.title)}
          aria-describedby={
            form.formState.errors.title ? `${titleId}-error` : undefined
          }
          className={inputClassName}
          {...form.register("title")}
        />

        {form.formState.errors.title ? (
          <p id={`${titleId}-error`} className="text-sm text-red-600">
            {form.formState.errors.title.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor={descriptionId}
          className="text-sm font-medium text-slate-800"
        >
          Instructions
          <span className="ml-1 font-normal text-slate-500">(optional)</span>
        </label>
        <textarea
          id={descriptionId}
          rows={5}
          disabled={disabled}
          placeholder="Explain the task, expected output, and submission requirements..."
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition
placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 disabled:cursor-not-allowed disabled:bg-slate-50"
          {...form.register("description")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor={dueDateId}
            className="text-sm font-medium text-slate-800"
          >
            Due date
            <span className="ml-1 font-normal text-slate-500">(optional)</span>
          </label>

          <input
            id={dueDateId}
            type="datetime-local"
            disabled={disabled}
            aria-invalid={Boolean(form.formState.errors.due_date)}
            aria-describedby={
              form.formState.errors.due_date ? `${dueDateId}-error` : undefined
            }
            className={inputClassName}
            {...form.register("due_date")}
          />
          {form.formState.errors.due_date ? (
            <p id={`${dueDateId}-error`} className="text-sm text-red-600">
              {form.formState.errors.due_date.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor={maxPointsId}
            className="text-sm font-medium text-slate-800"
          >
            Maximum points
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
            className={inputClassName}
            {...form.register("max_points", {
              valueAsNumber: true
            })}
          />
          {form.formState.errors.max_points ? (
            <p id={`${maxPointsId}-error`} className="text-sm text-red-600">
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
        className="space-y-3"
      >
        <legend className="text-sm font-medium text-slate-800">
          Allowed submission formats
        </legend>

        <p id={fileTypesHelpId} className="text-sm text-slate-500">
          Select at least one documented format.
        </p>

        <div className="flex flex-wrap gap-3">
          {ASSIGNMENT_FILE_TYPES.map((fileType) => (
            <label
              key={fileType}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium
text-slate-700"
            >
              <input
                type="checkbox"
                value={fileType}
                disabled={disabled}
                className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                {...form.register("allowed_file_types")}
              />
              {fileTypeLabels[fileType]}
            </label>
          ))}
        </div>

        {form.formState.errors.allowed_file_types ? (
          <p id={fileTypesErrorId} className="text-sm text-red-600">
            {form.formState.errors.allowed_file_types.message}
          </p>
        ) : null}
      </fieldset>

      <div className="border-t border-slate-100 pt-5">
        <label
          htmlFor={publicationId}
          className="inline-flex cursor-pointer items-start gap-3"
        >
          <input
            id={publicationId}
            type="checkbox"
            disabled={disabled}
            className="mt-1 h-4 w-4 rounded border-slate-300 accent-emerald-600"
            {...form.register("is_published")}
          />
          <span>
            <span className="block text-sm font-medium text-slate-800">
              Published to Praktikan
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-500">
              Leave unchecked to keep this assignment as a private draft.
            </span>
          </span>
        </label>
      </div>
    </>
  );
}
