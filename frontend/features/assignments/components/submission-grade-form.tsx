"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { useGradeAssignmentSubmission } from "../hooks/use-course-assignments";
import {
  createSubmissionGradeSchema,
  type SubmissionGradeFormValues
} from "../schemas/submission-grade.schema";
import type { AssignmentSubmission } from "../types/assignment.type";

type SubmissionGradeFormProps = {
  userId: string;
  courseId: string;
  assignmentId: string;
  maxPoints: number;
  submission: AssignmentSubmission;
  titleId: string;
  onCancel: () => void;
  onSaved: (submission: AssignmentSubmission) => void;
};

function getDefaultValues(
  submission: AssignmentSubmission
): SubmissionGradeFormValues {
  return {
    score: submission.score === null ? "" : String(submission.score),
    feedback: submission.feedback ?? ""
  };
}

function getGradeErrorMessage(error: Error, maxPoints: number) {
  if (!(error instanceof ApiError)) {
    return "Couldn't save this grade. Let's try that again.";
  }

  if (error.status === 401) {
    return "You've been signed out. Please sign in again.";
  }

  if (error.status === 403) {
    return "You don't have permission to grade this submission.";
  }

  if (error.status === 404) {
    return "This assignment or submission is no longer available.";
  }

  if (error.status === 400) {
    return `Score must be between 0 and ${maxPoints}.`;
  }

  if (error.status === 422) {
    return "Please check the score and feedback format.";
  }

  return "Couldn't reach the server. Let's try that again.";
}

export function SubmissionGradeForm({
  userId,
  courseId,
  assignmentId,
  maxPoints,
  submission,
  titleId,
  onCancel,
  onSaved
}: SubmissionGradeFormProps) {
  const schema = useMemo(
    () => createSubmissionGradeSchema(maxPoints),
    [maxPoints]
  );

  const mutation = useGradeAssignmentSubmission({
    userId,
    courseId,
    assignmentId
  });

  const form = useForm<SubmissionGradeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(submission)
  });

  function onSubmit(values: SubmissionGradeFormValues) {
    mutation.reset();

    mutation.mutate(
      {
        submissionId: submission.id,
        payload: {
          score: Number(values.score),
          feedback: values.feedback.length > 0 ? values.feedback : null
        }
      },
      { onSuccess: onSaved }
    );
  }

  const scoreId = `submission-${submission.id}-score`;
  const feedbackId = `submission-${submission.id}-feedback`;
  const studentLabel = submission.student_name
    ? `${submission.student_name} (${submission.student_username})`
    : submission.student_username;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
      aria-busy={mutation.isPending}
      className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-md max-h-[90dvh] overflow-y-auto shadow-xl space-y-4"
    >
      <div>
        <h4 id={titleId} className="font-bold text-sm text-slate-900">
          Grade {studentLabel}
        </h4>
        <p className="mt-0.5 text-[11px] text-slate-500 font-mono wrap-break-word">
          {submission.file_name}
        </p>
      </div>

      {mutation.isError ? (
        <div
          role="alert"
          className="rounded-2xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-medium text-rose-800 flex items-center gap-2"
        >
          <WarningCircleIcon className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
          <span>{getGradeErrorMessage(mutation.error, maxPoints)}</span>
        </div>
      ) : null}

      <div className="space-y-3 text-xs">
        <div>
          <label htmlFor={scoreId} className="block font-semibold text-slate-600 mb-1">
            Score (0 - {maxPoints})
          </label>
          <input
            id={scoreId}
            type="number"
            min={0}
            max={maxPoints}
            step="any"
            inputMode="decimal"
            disabled={mutation.isPending}
            aria-invalid={Boolean(form.formState.errors.score)}
            aria-describedby={
              form.formState.errors.score ? `${scoreId}-error` : undefined
            }
            className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100"
            {...form.register("score")}
          />
          {form.formState.errors.score ? (
            <p id={`${scoreId}-error`} className="mt-1 text-[11px] text-rose-600">
              {form.formState.errors.score.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={feedbackId} className="block font-semibold text-slate-600 mb-1">
            Feedback (Optional)
          </label>
          <textarea
            id={feedbackId}
            rows={3}
            disabled={mutation.isPending}
            placeholder="Add helpful feedback or notes for the student..."
            aria-invalid={Boolean(form.formState.errors.feedback)}
            aria-describedby={
              form.formState.errors.feedback ? `${feedbackId}-error` : undefined
            }
            className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none disabled:bg-slate-100"
            {...form.register("feedback")}
          />
          {form.formState.errors.feedback ? (
            <p id={`${feedbackId}-error`} className="mt-1 text-[11px] text-rose-600">
              {form.formState.errors.feedback.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={mutation.isPending}
          className="px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 shadow-xs disabled:opacity-60"
        >
          {mutation.isPending ? (
            <>
              <AsteriskLoader className="mr-1.5 h-3.5 w-3.5" />
              Saving...
            </>
          ) : (
            "Save Grade"
          )}
        </button>
      </div>
    </form>
  );
}
