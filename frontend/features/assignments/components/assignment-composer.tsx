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
import { ASSIGNMENT_FILE_TYPES } from "../types/assignment.type";
import { AssignmentFormFields } from "./assignment-form-fields";

type AssignmentComposerProps = {
  userId: string;
  courseId: string;
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
    return "Couldn't create the assignment. Let's try that again.";
  }

  if (error.status === 401) {
    return "You've been signed out. Please sign in again.";
  }

  if (error.status === 403) {
    return "You don't have permission to create assignments for this course.";
  }

  if (error.status === 404) {
    return "This course couldn't be found or is no longer assigned to you.";
  }

  if (error.status === 422) {
    return "Some assignment details need a quick fix. Check the highlighted fields.";
  }

  return "Couldn't reach the server. Let's try that again.";
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
        description:
          values.description.length > 0 ? values.description : null,
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
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
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
            Draft your prompt or release it directly to students.
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
            Assignment created!
          </p>
        ) : null}

        <AssignmentFormFields
          form={form}
          idPrefix="assignment-create"
          disabled={mutation.isPending}
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
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
