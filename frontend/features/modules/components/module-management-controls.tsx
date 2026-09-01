"use client";

import { Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { useSetCourseModulePublication } from "../hooks/use-course-modules";
import type { CourseModule } from "../types/module.type";
import { ModuleEditor } from "./module-editor";

type ModuleManagementControlsProps = { userId: string; courseId: string; module: CourseModule };

function getErrorMessage(error: Error) {
  if (!(error instanceof ApiError)) return "The module visibility could not be changed.";
  if (error.status === 401) return "Your session has expired. Sign in again to continue.";
  if (error.status === 403) return "You are not allowed to change this module's visibility.";
  if (error.status === 404) return "This module no longer exists.";
  if (error.status === 400 || error.status === 422) return "The visibility change was rejected.";
  return "A network or server problem prevented the visibility change.";
}

export function ModuleManagementControls({ userId, courseId, module }: ModuleManagementControlsProps) {
  const mutation = useSetCourseModulePublication({ userId, courseId });
  function changePublication() {
    mutation.reset();
    mutation.mutate({ moduleId: module.id, publish: !module.is_published });
  }

  return (
    <div className="mt-4">
      {mutation.isError ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{getErrorMessage(mutation.error)}</p> : null}
      {mutation.isSuccess ? <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{mutation.data.message}</p> : null}
      <button type="button" onClick={changePublication} disabled={mutation.isPending} className={module.is_published ? "mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:opacity-60" : "mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-60"}>
        {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {mutation.isPending ? "Updating..." : module.is_published ? "Unpublish module" : "Publish module"}
      </button>
      <ModuleEditor userId={userId} courseId={courseId} module={module} />
    </div>
  );
}
