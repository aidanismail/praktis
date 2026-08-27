"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardPlus, Loader2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { useCreateCourseAssignment } from "../hooks/use-course-assignments";
import {
  assignmentSchema,
  type AssignmentFormValues
} from "../schemas/assignment.schema";
import {
  ASSIGNMENT_FILE_TYPES,
  type AssignmentFileType
} from "../types/assignment.type";

type AssignmentComposerProps = {
  userId: string;
  courseId: string;
};

const fileTypeLabels: Record<AssignmentFileType, string> = {
  pdf: "PDF",
  zip: "ZIP",
  docx: "DOCX"
};

const defaultValues: AssignmentFormValues = {
  title: "",
  description: "",
  due_date: "",
  max_points: 100,
  allowed_file_types: [...ASSIGNMENT_FILE_TYPES],
  is_published: false
};

function getCreateErrorMessage(error: Error) {
  if (!(error instanceof ApiError)) {
    return "The assignment could not be created. Try again.";
  }

  if (error.status === 401) {
    return "Your session has expired. Sign in again to continue.";
  }

  if (error.status === 403) {
    return "You are not allowed to create assignments for this course.";
  }

  if (error.status === 404) {
    return "This course could not be found or is no longer assigned to you.";
  }

  if (error.status === 422) {
    return "Some assignment details are invalid. Review the form and try again.";
  }

  return "A network or server problem prevented the assignment from being created.";
}

export function AssignmentComposer({
  userId,
  courseId
}: AssignmentComposerProps) {
  const mutation = useCreateCourseAssignment({
    userId,
    courseId
  });

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues
  });

  const isPublished = useWatch({
    control: form.control,
    name: "is_published"
  });

  function onSubmit(values: AssignmentFormValues) {
    mutation.reset();

    mutation.mutate(
      {
        title: values.title,
        description: values.description.length > 0 ? values.description : null,
        due_date:
          values.due_date.length > 0
            ? new Date(values.due_date).toISOString()
            : null,
        max_points: values.max_points,
        allowed_file_types: values.allowed_file_types.join(","),
        is_published: values.is_published
      },
      {
        onSuccess: () => form.reset(defaultValues)
      }
    );
  }

  return (
    <section
      aria-labelledby="assignment-composer-heading"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm
        sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center
          rounded-xl bg-emerald-50 text-emerald-700"
        >
          <ClipboardPlus className="h-5 w-5" aria-hidden="true" />
        </span>

        <div>
          <h2
            id="assignment-composer-heading"
            className="font-semibold text-slate-950"
          >
            Create an assignment
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Save it as a draft or publish it immediately to enrolled Praktikan.
          </p>
        </div>
      </div>

      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-5 space-y-5"
        aria-busy={mutation.isPending}
      >
        {mutation.isError ? (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {getCreateErrorMessage(mutation.error)}
          </p>
        ) : null}

        {mutation.isSuccess ? (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            Assignment created successfully.
          </p>
        ) : null}

        <div className="space-y-2">
          <label
            htmlFor="assignment-title"
            className="text-sm font-medium text-slate-800"
          >
            Title
          </label>
          <input
            id="assignment-title"
            type="text"
            maxLength={255}
            disabled={mutation.isPending}
            placeholder="Example: Linked List Implementation"
            aria-invalid={Boolean(form.formState.errors.title)}
            aria-describedby={
              form.formState.errors.title ? "assignment-title-error" : undefined
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-white
              px-3 text-sm text-slate-950 outline-none transition
              placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4
              focus:ring-emerald-50 disabled:cursor-not-allowed disabled:bg-slate-50"
            {...form.register("title")}
          />
          {form.formState.errors.title ? (
            <p id="assignment-title-error" className="text-sm text-red-600">
              {form.formState.errors.title.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="assignment-description"
            className="text-sm font-medium text-slate-800"
          >
            Instructions
            <span className="ml-1 font-normal text-slate-500">(optional)</span>
          </label>
          <textarea
            id="assignment-description"
            rows={5}
            disabled={mutation.isPending}
            placeholder="Explain the task, expected output, and submission
              requirements..."
            className="w-full resize-y rounded-xl border border-slate-200 bg-white
              px-3 py-3 text-sm leading-6 text-slate-950 outline-none
              transition placeholder:text-slate-400 focus:border-emerald-500
              focus:ring-4 focus:ring-emerald-50 disabled:cursor-not-allowed
              disabled:bg-slate-50"
            {...form.register("description")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="assignment-due-date"
              className="text-sm font-medium text-slate-800"
            >
              Due date
              <span className="ml-1 font-normal text-slate-500">
                (optional)
              </span>
            </label>
            <input
              id="assignment-due-date"
              type="datetime-local"
              disabled={mutation.isPending}
              aria-invalid={Boolean(form.formState.errors.due_date)}
              aria-describedby={
                form.formState.errors.due_date
                  ? "assignment-due-date-error"
                  : undefined
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white
                px-3 text-sm text-slate-950 outline-none transition
                focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50
                disabled:cursor-not-allowed disabled:bg-slate-50"
              {...form.register("due_date")}
            />
            {form.formState.errors.due_date ? (
              <p
                id="assignment-due-date-error"
                className="text-sm text-red-600"
              >
                {form.formState.errors.due_date.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="assignment-max-points"
              className="text-sm font-medium text-slate-800"
            >
              Maximum points
            </label>
            <input
              id="assignment-max-points"
              type="number"
              min={1}
              max={1000}
              step={1}
              disabled={mutation.isPending}
              aria-invalid={Boolean(form.formState.errors.max_points)}
              aria-describedby={
                form.formState.errors.max_points
                  ? "assignment-max-points-error"
                  : undefined
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white
                px-3 text-sm text-slate-950 outline-none transition
                focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50
                disabled:cursor-not-allowed disabled:bg-slate-50"
              {...form.register("max_points", {
                valueAsNumber: true
              })}
            />
            {form.formState.errors.max_points ? (
              <p
                id="assignment-max-points-error"
                className="text-sm text-red-600"
              >
                {form.formState.errors.max_points.message}
              </p>
            ) : null}
          </div>
        </div>

        <fieldset
          aria-describedby={
            form.formState.errors.allowed_file_types
              ? "assignment-file-types-error"
              : "assignment-file-types-help"
          }
          className="space-y-3"
        >
          <legend className="text-sm font-medium text-slate-800">
            Allowed submission formats
          </legend>

          <p id="assignment-file-types-help" className="text-sm text-slate-500">
            Select at least one documented format.
          </p>

          <div className="flex flex-wrap gap-3">
            {ASSIGNMENT_FILE_TYPES.map((fileType) => (
              <label
                key={fileType}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2
                  rounded-xl border border-slate-200 bg-white px-4 text-sm
                  font-medium text-slate-700"
              >
                <input
                  type="checkbox"
                  value={fileType}
                  disabled={mutation.isPending}
                  className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                  {...form.register("allowed_file_types")}
                />
                {fileTypeLabels[fileType]}
              </label>
            ))}
          </div>

          {form.formState.errors.allowed_file_types ? (
            <p
              id="assignment-file-types-error"
              className="text-sm text-red-600"
            >
              {form.formState.errors.allowed_file_types.message}
            </p>
          ) : null}
        </fieldset>

        <div
          className="flex flex-wrap items-center justify-between gap-4
          border-t border-slate-100 pt-5"
        >
          <label className="inline-flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              disabled={mutation.isPending}
              className="mt-1 h-4 w-4 rounded border-slate-300 accent-emerald-600"
              {...form.register("is_published")}
            />
            <span>
              <span className="block text-sm font-medium text-slate-800">
                Publish immediately
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                Leave unchecked to save a private draft.
              </span>
            </span>
          </label>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-xl
              bg-emerald-700 px-5 text-sm font-semibold text-white transition
              hover:bg-emerald-800 focus-visible:outline-2
              focus-visible:outline-offset-2 focus-visible:outline-emerald-700
              disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Creating...
              </>
            ) : isPublished ? (
              "Publish assignment"
            ) : (
              "Save draft"
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
