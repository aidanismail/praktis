"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { useUpdateCourseModule } from "../hooks/use-course-modules";
import {
  moduleMetadataSchema,
  type ModuleMetadataFormValues
} from "../schemas/module.schema";
import type { CourseModule } from "../types/module.type";
import { NotificationBanner } from "@/components/ui/notification-banner";

type ModuleEditorProps = {
  userId: string;
  courseId: string;
  module: CourseModule;
};

function getModuleValues(module: CourseModule): ModuleMetadataFormValues {
  return {
    title: module.title,
    description: module.description ?? ""
  };
}

function getUpdateErrorMessage(error: Error) {
  if (!(error instanceof ApiError)) {
    return "Unable to update module. Please try again.";
  }

  if (error.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (error.status === 403) {
    return "You do not have permission to update this module.";
  }

  if (error.status === 404) {
    return "Module not found.";
  }

  if (error.status === 400 || error.status === 422) {
    return "Please correct the errors in the form.";
  }

  return "Unable to connect to the server. Please try again.";
}

export function ModuleEditor({ userId, courseId, module }: ModuleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);

  const editButtonId = `module-edit-trigger-${module.id}`;
  const formId = `module-edit-form-${module.id}`;
  const titleId = `module-edit-title-${module.id}`;
  const descriptionId = `module-edit-description-${module.id}`;

  const mutation = useUpdateCourseModule({
    userId,
    courseId
  });

  const form = useForm<ModuleMetadataFormValues>({
    resolver: zodResolver(moduleMetadataSchema),
    defaultValues: getModuleValues(module)
  });

  useEffect(() => {
    form.reset(getModuleValues(module));
  }, [form, module]);

  function startEditing() {
    mutation.reset();
    form.reset(getModuleValues(module));
    setIsEditing(true);

    requestAnimationFrame(() => {
      document.getElementById(titleId)?.focus();
    });
  }

  function cancelEditing() {
    mutation.reset();
    form.reset(getModuleValues(module));
    setIsEditing(false);

    requestAnimationFrame(() => {
      document.getElementById(editButtonId)?.focus();
    });
  }

  function onSubmit(values: ModuleMetadataFormValues) {
    mutation.reset();

    mutation.mutate(
      {
        moduleId: module.id,
        payload: {
          title: values.title,
          description: values.description
        }
      },
      {
        onSuccess: () => {
          setIsEditing(false);

          requestAnimationFrame(() => {
            document.getElementById(editButtonId)?.focus();
          });
        }
      }
    );
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      {!isEditing ? (
        <>
          {mutation.isSuccess ? (
            <div className="mb-3">
              <NotificationBanner
                variant="success"
                message="Module updated."
              />
            </div>
          ) : null}

          <button
            id={editButtonId}
            type="button"
            onClick={startEditing}
            aria-expanded={false}
            aria-controls={formId}
            className="apple-press inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            Edit details
          </button>
        </>
      ) : (
        <form
          id={formId}
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          aria-busy={mutation.isPending}
          className="space-y-4 rounded-2xl bg-slate-50 p-4"
        >
          <h4 className="font-semibold text-slate-950">Edit module details</h4>

          {mutation.isError ? (
            <NotificationBanner
              variant="error"
              message={getUpdateErrorMessage(mutation.error)}
            />
          ) : null}

          <div className="space-y-2">
            <label
              htmlFor={titleId}
              className="text-sm font-medium text-slate-800"
            >
              Title
            </label>
            <input
              id={titleId}
              type="text"
              maxLength={255}
              disabled={mutation.isPending}
              aria-invalid={Boolean(form.formState.errors.title)}
              aria-describedby={
                form.formState.errors.title ? `${titleId}-error` : undefined
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
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
              Description
            </label>
            <textarea
              id={descriptionId}
              rows={4}
              maxLength={2000}
              disabled={mutation.isPending}
              aria-invalid={Boolean(form.formState.errors.description)}
              aria-describedby={
                form.formState.errors.description
                  ? `${descriptionId}-error`
                  : undefined
              }
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
              {...form.register("description")}
            />

            {form.formState.errors.description ? (
              <p id={`${descriptionId}-error`} className="text-sm text-red-600">
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={cancelEditing}
              disabled={mutation.isPending}
              className="apple-press inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="apple-press inline-flex min-h-10 items-center justify-center rounded-full bg-slate-900 px-5 text-xs font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? (
                <>
                  <AsteriskLoader
                    className="mr-2 h-4 w-4"
                  />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
