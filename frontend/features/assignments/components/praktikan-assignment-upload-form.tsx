"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileArrowUp, ArrowCounterClockwise } from "@phosphor-icons/react";
import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { ApiError } from "@/lib/api/client";
import { useSubmitAssignment } from "../hooks/use-course-assignments";
import {
  ASSIGNMENT_MAX_UPLOAD_BYTES,
  createAssignmentSubmissionSchema,
  type AssignmentSubmissionFormValues,
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
  zip: ".zip,application/zip",
  docx: ".docx",
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
  userId,
}: PraktikanAssignmentUploadFormProps) {
  const inputId = useId();
  const successStatusRef = useRef<HTMLDivElement>(null);
  const [inputKey, setInputKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const submissionMutation = useSubmitAssignment({
    userId,
    courseId,
    assignmentId,
  });
  const submissionSchema = useMemo(
    () => createAssignmentSubmissionSchema(allowedFileTypes),
    [allowedFileTypes]
  );
  const form = useForm<AssignmentSubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
  });

  useEffect(() => {
    if (successMessage) successStatusRef.current?.focus();
  }, [successMessage]);

  if (allowedFileTypes.length === 0) {
    return (
      <NotificationBanner
        variant="warning"
        message="This assignment does not list a supported PDF, ZIP, or DOCX format."
      />
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
      },
    });
  }

  return (
    <section
      aria-labelledby="assignment-upload-heading"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          {hasSubmission ? (
            <ArrowCounterClockwise className="h-5 w-5" aria-hidden="true" />
          ) : (
            <FileArrowUp className="h-5 w-5" aria-hidden="true" />
          )}
        </span>
        <div>
          <h2 id="assignment-upload-heading" className="text-lg font-bold text-slate-950">
            {hasSubmission ? "Turn in a new version" : "Turn in assignment"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {hasSubmission
              ? "Uploading a new file replaces your current submission and clears previous feedback."
              : "Select your assignment file and click turn in."}
          </p>
        </div>
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit(submitFile)}
        noValidate
      >
        <div>
          <label htmlFor={inputId} className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
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
                className="block w-full text-xs text-slate-700 border border-slate-200 rounded-2xl bg-slate-50/50 p-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              />
            )}
          />
          <p id={`${inputId}-help`} className="mt-2 text-[11px] text-slate-400">
            Accepted: {allowedLabel}. Maximum size: {ASSIGNMENT_MAX_UPLOAD_BYTES / (1024 * 1024)} MiB.
          </p>
          {form.formState.errors.file ? (
            <p id={`${inputId}-error`} role="alert" className="mt-2 text-xs font-semibold text-red-600">
              {form.formState.errors.file.message}
            </p>
          ) : null}
        </div>

        {submissionMutation.isError ? (
          <NotificationBanner
            variant="error"
            message={getSubmissionErrorMessage(submissionMutation.error)}
          />
        ) : null}

        {successMessage ? (
          <NotificationBanner
            ref={successStatusRef}
            variant="success"
            message={successMessage}
            tabIndex={-1}
          />
        ) : null}

        <button
          type="submit"
          disabled={submissionMutation.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 shadow-xs disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submissionMutation.isPending ? (
            <AsteriskLoader className="h-3.5 w-3.5" />
          ) : hasSubmission ? (
            <ArrowCounterClockwise className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <FileArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
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
