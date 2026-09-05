"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { useUpdateCourseModule } from "../hooks/use-course-modules";
import {
  moduleMetadataSchema,
  type ModuleMetadataFormValues
} from "../schemas/module.schema";
import type { CourseModule } from "../types/module.type";

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
    return "Couldn't update this module. Let's try that again.";
  }

  if (error.status === 401) {
    return "You've been signed out. Please sign in again.";
  }

  if (error.status === 403) {
    return "You don't have permission to update this module.";
  }

  if (error.status === 404) {
    return "This module could not be found.";
  }

  if (error.status === 400 || error.status === 422) {
    return "Some module details were rejected. Please review the form.";
  }

  return "Couldn't reach the server. Let's try that again.";
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
            <p
              role="status"
              className="mb-3 rounded-xl bg-emerald-50
                  px-4 py-3 text-sm text-emerald-800"
            >
              Changes saved!
            </p>
          ) : null}

          <button
            id={editButtonId}
            type="button"
            onClick={startEditing}
            aria-expanded={false}
            aria-controls={formId}
            className="inline-flex min-h-11 items-center
                gap-2 rounded-xl border border-slate-300
                bg-white px-4 text-sm font-semibold
                text-slate-800 transition hover:bg-slate-50
                focus-visible:outline-2
                focus-visible:outline-offset-2
                focus-visible:outline-emerald-700"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
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
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3
                  text-sm text-red-700"
            >
              {getUpdateErrorMessage(mutation.error)}
            </p>
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
              className="h-11 w-full rounded-xl border
                  border-slate-200 bg-white px-3 text-sm
                  text-slate-950 outline-none transition
                  focus:border-emerald-500 focus:ring-4
                  focus:ring-emerald-50
                  disabled:cursor-not-allowed
                  disabled:bg-slate-100"
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
              <span className="ml-1 font-normal text-slate-500">
                (optional)
              </span>
            </label>
            <textarea
              id={descriptionId}
              rows={4}
              maxLength={500}
              disabled={mutation.isPending}
              aria-invalid={Boolean(form.formState.errors.description)}
              aria-describedby={
                form.formState.errors.description
                  ? `${descriptionId}-error`
                  : undefined
              }
              className="w-full resize-y rounded-xl border
                  border-slate-200 bg-white px-3 py-3 text-sm
                  leading-6 text-slate-950 outline-none transition
                  focus:border-emerald-500 focus:ring-4
                  focus:ring-emerald-50
                  disabled:cursor-not-allowed
                  disabled:bg-slate-100"
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
              className="inline-flex min-h-11 items-center
                  gap-2 rounded-xl border border-slate-300
                  bg-white px-4 text-sm font-semibold
                  text-slate-800 transition hover:bg-slate-100
                  focus-visible:outline-2
                  focus-visible:outline-offset-2
                  focus-visible:outline-slate-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex min-h-11 items-center
                  justify-center rounded-xl bg-emerald-700
                  px-5 text-sm font-semibold text-white
                  transition hover:bg-emerald-800
                  focus-visible:outline-2
                  focus-visible:outline-offset-2
                  focus-visible:outline-emerald-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60"
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
      )}
    </div>
  );
}
