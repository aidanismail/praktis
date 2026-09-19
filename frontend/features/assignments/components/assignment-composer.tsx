"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { useCreateCourseAssignment } from "../hooks/use-course-assignments";
import {
  assignmentSchema,
  type AssignmentFormValues
} from "../schemas/assignment.schema";
import { ASSIGNMENT_FILE_TYPES } from "../types/assignment.type";
import { AssignmentFormFields } from "./assignment-form-fields";
import { NotificationBanner } from "@/components/ui/notification-banner";

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
      className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs"
    >
      <div>
        <h2
          id="assignment-composer-heading"
          className="text-sm font-bold tracking-tight text-slate-950"
        >
          Create assignment
        </h2>

        <p className="mt-0.5 text-xs text-slate-500">
          Draft your task prompt or release directly to students.
        </p>
      </div>

      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-4 space-y-3.5"
        aria-busy={mutation.isPending}
      >
        {mutation.isError ? (
          <NotificationBanner
            variant="error"
            message={getCreateErrorMessage(mutation.error)}
          />
        ) : null}

        {mutation.isSuccess ? (
          <NotificationBanner
            variant="success"
            message="Assignment created!"
          />
        ) : null}

        <AssignmentFormFields
          form={form}
          idPrefix="assignment-create"
          disabled={mutation.isPending}
          compact
        />

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="apple-press inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60 shadow-xs"
          >
            {mutation.isPending ? (
              <>
                <Loader2
                  className="mr-1.5 h-3.5 w-3.5 animate-spin"
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
