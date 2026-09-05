"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
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
  onCancel: () => void;
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
  onCancel
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

  useEffect(() => {
    form.reset(getDefaultValues(submission));
  }, [form, submission]);

  function onSubmit(values: SubmissionGradeFormValues) {
    mutation.reset();

    mutation.mutate({
      submissionId: submission.id,
      payload: {
        score: Number(values.score),
        feedback: values.feedback.length > 0 ? values.feedback : null
      }
    });
  }

  const scoreId = `submission-${submission.id}-score`;
  const feedbackId = `submission-${submission.id}-feedback`;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
      aria-busy={mutation.isPending}
      className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
    >
      {mutation.isError ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {getGradeErrorMessage(mutation.error, maxPoints)}
        </p>
      ) : null}

      {mutation.isSuccess ? (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          Grade recorded!
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor={scoreId} className="text-sm font-medium text-slate-800">
          Score out of {maxPoints}
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
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 disabled:cursor-not-allowed disabled:bg-slate-100"
          {...form.register("score")}
        />

        {form.formState.errors.score ? (
          <p id={`${scoreId}-error`} className="text-sm text-red-600">
            {form.formState.errors.score.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor={feedbackId}
          className="text-sm font-medium text-slate-800"
        >
          Private feedback
          <span className="ml-1 font-normal text-slate-500">(optional)</span>
        </label>

        <textarea
          id={feedbackId}
          rows={4}
          disabled={mutation.isPending}
          placeholder="Add constructive notes or feedback for the student..."
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 disabled:cursor-not-allowed disabled:bg-slate-100"
          {...form.register("feedback")}
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            mutation.reset();
            onCancel();
          }}
          disabled={mutation.isPending}
          className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
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
          ) : submission.score === null ? (
            "Save grade"
          ) : (
            "Update grade"
          )}
        </button>
      </div>
    </form>
  );
}
