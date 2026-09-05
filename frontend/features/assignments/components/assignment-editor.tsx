"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { useUpdateCourseAssignment } from "../hooks/use-course-assignments";
import {
  assignmentSchema,
  type AssignmentFormValues
} from "../schemas/assignment.schema";
import {
  ASSIGNMENT_FILE_TYPES,
  type Assignment,
  type AssignmentFileType
} from "../types/assignment.type";
import { AssignmentFormFields } from "./assignment-form-fields";

type AssignmentEditorProps = {
  userId: string;
  courseId: string;
  assignment: Assignment;
};

function toLocalDateTime(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000
  );

  return localDate.toISOString().slice(0, 16);
}

function getAllowedFileTypes(value: string): AssignmentFileType[] {
  return value
    .split(",")
    .map((fileType) => fileType.trim().toLowerCase())
    .filter(
      (fileType): fileType is AssignmentFileType =>
        ASSIGNMENT_FILE_TYPES.includes(fileType as AssignmentFileType)
    );
}

function getFormValues(assignment: Assignment): AssignmentFormValues {
  return {
    title: assignment.title,
    description: assignment.description ?? "",
    due_date: toLocalDateTime(assignment.due_date),
    max_points: assignment.max_points,
    allowed_file_types: getAllowedFileTypes(assignment.allowed_file_types),
    is_published: assignment.is_published
  };
}

function getUpdateErrorMessage(error: Error) {
  if (!(error instanceof ApiError)) {
    return "Couldn't save your changes. Let's try that again.";
  }

  if (error.status === 401) {
    return "You've been signed out. Please sign in again.";
  }

  if (error.status === 403) {
    return "You don't have permission to update this assignment.";
  }

  if (error.status === 404) {
    return "This assignment couldn't be found. It may have been deleted.";
  }

  if (error.status === 400 || error.status === 422) {
    return "Some assignment details need a quick fix. Check the highlighted fields.";
  }

  return "Couldn't reach the server. Let's try that again.";
}

export function AssignmentEditor({
  userId,
  courseId,
  assignment
}: AssignmentEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const editButtonId = `assignment-edit-trigger-${assignment.id}`;
  const titleInputId = `assignment-edit-${assignment.id}-title`;

  const mutation = useUpdateCourseAssignment({
    userId,
    courseId,
    assignmentId: assignment.id
  });

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: getFormValues(assignment)
  });

  useEffect(() => {
    form.reset(getFormValues(assignment));
  }, [assignment, form]);

  function startEditing() {
    mutation.reset();
    form.reset(getFormValues(assignment));
    setIsEditing(true);

    requestAnimationFrame(() => {
      document.getElementById(titleInputId)?.focus();
    });
  }

  function cancelEditing() {
    mutation.reset();
    form.reset(getFormValues(assignment));
    setIsEditing(false);

    requestAnimationFrame(() => {
      document.getElementById(editButtonId)?.focus();
    });
  }

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
        onSuccess: (updatedAssignment) => {
          form.reset(getFormValues(updatedAssignment));
          setIsEditing(false);

          requestAnimationFrame(() => {
            document.getElementById(editButtonId)?.focus();
          });
        }
      }
    );
  }

  return (
    <section
      aria-labelledby="assignment-settings-heading"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            id="assignment-settings-heading"
            className="text-lg font-semibold text-slate-950"
          >
            Assignment settings
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Edit instructions, due dates, grading criteria, and visibility.
          </p>
        </div>

        {!isEditing ? (
          <button
            id={editButtonId}
            type="button"
            onClick={startEditing}
            aria-expanded={false}
            aria-controls="assignment-edit-form"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit assignment
          </button>
        ) : null}
      </div>

      {mutation.isSuccess && !isEditing ? (
        <p
          role="status"
          className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          Changes saved!
        </p>
      ) : null}

      {isEditing ? (
        <form
          id="assignment-edit-form"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          aria-busy={mutation.isPending}
          className="mt-6 space-y-5"
        >
          {mutation.isError ? (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {getUpdateErrorMessage(mutation.error)}
            </p>
          ) : null}

          <AssignmentFormFields
            form={form}
            idPrefix={`assignment-edit-${assignment.id}`}
            disabled={mutation.isPending}
          />

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={cancelEditing}
              disabled={mutation.isPending}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </button>

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
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
