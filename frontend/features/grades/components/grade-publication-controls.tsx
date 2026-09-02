"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import type { CourseSession } from "@/features/sessions/types/session.type";
import { useSetSessionGradePublication } from "../hooks/use-session-grades";

type GradePublicationControlsProps = {
  userId: string;
  courseId: string;
  session: CourseSession;
  savedGradeCount: number;
  rosterCount: number;
  hasUnsavedChanges: boolean;
};

function getPublicationError(error: Error | null) {
  if (!error) return null;

  if (error instanceof ApiError) {
    if (error.status === 400)
      return "Grades are already in that publication state. Refresh before retrying.";
    if (error.status === 401)
      return "Your session expired. Sign in again before changing publication.";
    if (error.status === 403)
      return "You are not allowed to publish grades for this course.";
    if (error.status === 404)
      return "The session no longer exists. Return to the session list.";
    if (error.status === 409)
      return "The grade publication state changed elsewhere. Refresh before retrying.";
  }

  return "The publication state could not be changed because of a network or server problem.";
}

export function GradePublicationControls({
  userId,
  courseId,
  session,
  savedGradeCount,
  rosterCount,
  hasUnsavedChanges
}: GradePublicationControlsProps) {
  const publicationMutation = useSetSessionGradePublication({
    userId,
    courseId,
    sessionId: session.id
  });
  const errorMessage = getPublicationError(publicationMutation.error);
  const incomplete = savedGradeCount < rosterCount;

  function changePublication(publish: boolean) {
    publicationMutation.reset();

    const confirmation = publish
      ? incomplete
        ? `Publish ${savedGradeCount} saved grades for ${rosterCount} enrolled Praktikan? Students without a saved grade will not see a result.`
        : `Publish all ${savedGradeCount} saved session grades to Praktikan?`
      : "Unpublish these session grades? Praktikan will no longer be able to see their current results.";

    if (!window.confirm(confirmation)) {
      return;
    }

    publicationMutation.mutate(publish);
  }

  return (
    <section aria-labelledby="grade-publication-heading" className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 id="grade-publication-heading" className="font-semibold text-slate-950">
            Grade visibility
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {session.grades_published
              ? "Published grades are visible only to each Praktikan who has a saved result."
              : "Draft grades are staff-only and are not visible to Praktikan."}
          </p>
          <p className="mt-2 text-sm font-medium text-slate-700">
            {savedGradeCount} saved of {rosterCount} enrolled
          </p>
          {hasUnsavedChanges ? (
            <p className="mt-2 text-sm text-amber-800">
              Save or reset local grade changes before changing publication.
            </p>
          ) : null}
        </div>

        {session.grades_published ? (
          <button
            type="button"
            onClick={() => changePublication(false)}
            disabled={publicationMutation.isPending || hasUnsavedChanges}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {publicationMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <EyeOff className="h-4 w-4" aria-hidden="true" />}
            {publicationMutation.isPending ? "Unpublishing..." : "Unpublish grades"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => changePublication(true)}
            disabled={publicationMutation.isPending || savedGradeCount === 0 || hasUnsavedChanges}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {publicationMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            {publicationMutation.isPending ? "Publishing..." : "Publish grades"}
          </button>
        )}
      </div>

      {errorMessage ? <p role="alert" className="mt-3 text-sm text-red-700">{errorMessage}</p> : null}
      {publicationMutation.isSuccess ? (
        <p role="status" aria-live="polite" className="mt-3 text-sm text-emerald-700">
          {publicationMutation.data.message}
        </p>
      ) : null}
    </section>
  );
}
