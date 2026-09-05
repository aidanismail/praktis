"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileUp, Loader2, RotateCcw } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { useSubmitAssignment } from "../hooks/use-course-assignments";
import {
  ASSIGNMENT_MAX_UPLOAD_BYTES,
  createAssignmentSubmissionSchema,
  type AssignmentSubmissionFormValues
} from "../schemas/assignment.schema";
import type { AssignmentFileType } from "../types/assignment.type";

type PraktikanAssignmentUploadFormProps = {
  allowedFileTypes: AssignmentFileType[];
  assignmentId: string;
  courseId: string;
  hasSubmission: boolean;
  userId: string;
};

const ACCEPTED_FILE_TYPES: Record<AssignmentFileType, string> = {
  pdf: ".pdf,application/pdf",
  zip: ".zip,application/zip,application/x-zip-compressed",
  docx: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

function getSubmissionErrorMessage(error: Error) {
  if (!(error instanceof ApiError)) {
    return "Couldn't upload your file due to a connection issue. Your file is still selected—try submitting again.";
  }

  switch (error.status) {
    case 400:
      return "This file format seems corrupted or unsupported. Please check that it's a valid PDF, ZIP, or DOCX document.";
    case 401:
      return "You've been signed out. Please sign in again before uploading.";
    case 403:
      return "You don't have permission to submit to this assignment.";
    case 404:
      return "This assignment is no longer active or was removed.";
    case 409:
      return "A newer submission was saved recently. Refresh to review before trying again.";
    case 413:
      return "That file is too large. Please keep your upload under 10 MB.";
    case 422:
      return "The upload couldn't be processed. Make sure the file isn't empty or damaged.";
    default:
      return "Upload didn't go through. Your file is still selected—give it another try.";
  }
}

export function PraktikanAssignmentUploadForm({
  allowedFileTypes,
  assignmentId,
  courseId,
  hasSubmission,
  userId
}: PraktikanAssignmentUploadFormProps) {
  const inputId = useId();
  const successStatusRef = useRef<HTMLParagraphElement>(null);
  const [inputKey, setInputKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const submissionMutation = useSubmitAssignment({
    userId,
    courseId,
    assignmentId
  });
  const submissionSchema = useMemo(
    () => createAssignmentSubmissionSchema(allowedFileTypes),
    [allowedFileTypes]
  );
  const form = useForm<AssignmentSubmissionFormValues>({
    resolver: zodResolver(submissionSchema)
  });

  useEffect(() => {
    if (successMessage) successStatusRef.current?.focus();
  }, [successMessage]);

  if (allowedFileTypes.length === 0) {
    return (
      <section
        aria-labelledby="assignment-upload-heading"
        className="rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-6"
      >
        <h2 id="assignment-upload-heading" className="font-semibold text-amber-950">
          Submission unavailable
        </h2>
        <p className="mt-2 text-sm leading-6 text-amber-800">
          This assignment does not list a supported PDF, ZIP, or DOCX format.
        </p>
      </section>
    );
  }

  const allowedLabel = allowedFileTypes
    .map((fileType) => fileType.toUpperCase())
    .join(", ");
  const accept = allowedFileTypes
    .map((fileType) => ACCEPTED_FILE_TYPES[fileType])
    .join(",");

  function submitFile(values: AssignmentSubmissionFormValues) {
    if (
      hasSubmission &&
      !window.confirm(
        "Turn in a new version? This replaces your current file and resets any previous score."
      )
    ) {
      return;
    }

    setSuccessMessage(null);
    submissionMutation.mutate(values.file, {
      onSuccess: () => {
        setSuccessMessage(
          hasSubmission
            ? "New version turned in! Your updated file has been saved."
            : "You're all set! Your assignment has been turned in."
        );
        form.reset();
        setInputKey((currentKey) => currentKey + 1);
      }
    });
  }

  return (
    <section
      aria-labelledby="assignment-upload-heading"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-brand">
          {hasSubmission ? (
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
          ) : (
            <FileUp className="h-5 w-5" aria-hidden="true" />
          )}
        </span>
        <div>
          <h2 id="assignment-upload-heading" className="text-lg font-semibold text-slate-950">
            {hasSubmission ? "Turn in a new version" : "Turn in assignment"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {hasSubmission
              ? "Uploading a new file replaces your current submission and clears previous feedback."
              : "Select your assignment file and click turn in."}
          </p>
        </div>
      </div>

      <form
        className="mt-5 space-y-4"
        onSubmit={form.handleSubmit(submitFile)}
        noValidate
      >
        <div>
          <label htmlFor={inputId} className="text-sm font-semibold text-slate-800">
            Assignment file
          </label>
          <Controller
            name="file"
            control={form.control}
            render={({ field }) => (
              <input
                key={inputKey}
                id={inputId}
                name={field.name}
                onBlur={field.onBlur}
                ref={field.ref}
                type="file"
                accept={accept}
                disabled={submissionMutation.isPending}
                aria-describedby={`${inputId}-help${form.formState.errors.file ? ` ${inputId}-error` : ""}`}
                aria-invalid={Boolean(form.formState.errors.file)}
                onChange={(event) => {
                  submissionMutation.reset();
                  setSuccessMessage(null);
                  field.onChange(event.target.files?.[0]);
                }}
                className="mt-2 block min-h-11 w-full cursor-pointer rounded-xl border border-slate-300 bg-white text-sm text-slate-700 file:mr-4 file:min-h-11 file:border-0 file:border-r file:border-slate-200 file:bg-slate-50 file:px-4 file:text-sm file:font-semibold file:text-slate-800 hover:file:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
              />
            )}
          />
          <p id={`${inputId}-help`} className="mt-2 text-xs leading-5 text-slate-500">
            Accepted: {allowedLabel}. Maximum size: {ASSIGNMENT_MAX_UPLOAD_BYTES / (1024 * 1024)} MiB.
          </p>
          {form.formState.errors.file ? (
            <p id={`${inputId}-error`} role="alert" className="mt-2 text-sm text-red-700">
              {form.formState.errors.file.message}
            </p>
          ) : null}
        </div>

        {submissionMutation.isError ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
            {getSubmissionErrorMessage(submissionMutation.error)}
          </div>
        ) : null}

        {successMessage ? (
          <p
            ref={successStatusRef}
            role="status"
            tabIndex={-1}
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800 outline-none"
          >
            {successMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submissionMutation.isPending}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submissionMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : hasSubmission ? (
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          ) : (
            <FileUp className="h-4 w-4" aria-hidden="true" />
          )}
          {submissionMutation.isPending
            ? "Turning in..."
            : hasSubmission
              ? "Turn in new version"
              : "Turn in"}
        </button>
      </form>
    </section>
  );
}
