"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Loader2,
  RotateCcw,
  X
} from "lucide-react";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import {
  useConfirmCourseModuleUpload,
  useRequestCourseModuleUpload,
  useUploadCourseModuleFile
} from "../hooks/use-course-modules";
import {
  getModuleFileExtension,
  moduleUploadSchema,
  type ModuleUploadFormValues
} from "../schemas/module.schema";

type ModuleUploadFormProps = {
  userId: string;
  courseId: string;
};

type UploadStage =
  | "idle"
  | "requesting"
  | "uploading"
  | "confirming"
  | "failed"
  | "complete";

type FailedStage = "presign" | "upload" | "confirm" | null;

type UploadAttempt = {
  title: string;
  description: string;
  file: File;
  uploadUrl: string;
  fileKey: string;
  requestedAt: number;
};

const uploadDefaultValues = {
  title: "",
  description: ""
};

const SAFE_RETRY_WINDOW_MS = 55 * 60 * 1000;

function getCurrentTimestamp() {
  return Date.now();
}

function getUploadErrorMessage(
  failedStage: Exclude<FailedStage, null>,
  error: unknown
) {
  if (failedStage === "upload") {
    if (error instanceof ApiError && error.status === 413) {
      return "That file is too large to upload (maximum 25 MiB).";
    }

    if (error instanceof ApiError && error.status === 403) {
      return "The upload link expired. Discard this attempt to get a fresh link.";
    }

    return "The file didn't finish uploading. You can retry while the link is active.";
  }

  if (!(error instanceof ApiError)) {
    return failedStage === "confirm"
      ? "Confirmation took too long. Refresh the page to verify if your module was saved."
      : "Couldn't start the upload. Let's try that again.";
  }

  if (error.status === 401) {
    return "You've been signed out. Please sign in again.";
  }

  if (error.status === 403) {
    return "You don't have permission to upload modules for this course.";
  }

  if (error.status === 404) {
    return "This course couldn't be found or is no longer assigned to you.";
  }

  if (error.status === 400) {
    return failedStage === "confirm"
      ? "Storage couldn't process this file. Please ensure it's a valid PDF or DOCX file."
      : "That file format isn't supported. Please upload a PDF or DOCX.";
  }

  if (error.status === 422) {
    return "Please check the module title and details.";
  }

  return failedStage === "confirm"
    ? "Confirmation took too long. Refresh the page to verify if your module was saved."
    : "Couldn't reach the server. Let's try that again.";
}
export function ModuleUploadForm({ userId, courseId }: ModuleUploadFormProps) {
  const generatedId = useId();
  const statusId = `module-upload-status-${generatedId}`;

  const [stage, setStage] = useState<UploadStage>("idle");
  const [failedStage, setFailedStage] = useState<FailedStage>(null);
  const [attempt, setAttempt] = useState<UploadAttempt | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptExpired, setAttemptExpired] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const scope = { userId, courseId };

  const presignMutation = useRequestCourseModuleUpload(scope);
  const storageMutation = useUploadCourseModuleFile();
  const confirmMutation = useConfirmCourseModuleUpload(scope);

  const form = useForm<ModuleUploadFormValues>({
    resolver: zodResolver(moduleUploadSchema),
    defaultValues: uploadDefaultValues
  });

  const isBusy =
    presignMutation.isPending ||
    storageMutation.isPending ||
    confirmMutation.isPending;

  const hasLockedAttempt = stage === "failed" && attempt !== null;

  const fieldsDisabled = isBusy || hasLockedAttempt;

  const busyMessage =
    stage === "requesting"
      ? "Preparing upload link..."
      : stage === "uploading"
        ? "Uploading file..."
        : stage === "confirming"
          ? "Saving module..."
          : null;

  function focusStatus() {
    requestAnimationFrame(() => {
      document.getElementById(statusId)?.focus();
    });
  }

  function resetMutations() {
    presignMutation.reset();
    storageMutation.reset();
    confirmMutation.reset();
  }
  function failAttempt(failedAt: Exclude<FailedStage, null>, error: unknown) {
    setFailedStage(failedAt);
    setErrorMessage(getUploadErrorMessage(failedAt, error));
    setStage("failed");
    focusStatus();
  }

  async function confirmAttempt(currentAttempt: UploadAttempt) {
    setStage("confirming");
    confirmMutation.reset();

    try {
      await confirmMutation.mutateAsync({
        title: currentAttempt.title,
        description: currentAttempt.description,
        file_key: currentAttempt.fileKey
      });

      setAttempt(null);
      setAttemptExpired(false);
      setFailedStage(null);
      setErrorMessage(null);
      setStage("complete");
      form.reset(uploadDefaultValues);
      setFileInputKey((current) => current + 1);
      focusStatus();
    } catch (error) {
      failAttempt("confirm", error);
    }
  }

  async function uploadAndConfirm(currentAttempt: UploadAttempt) {
    setStage("uploading");
    storageMutation.reset();

    try {
      await storageMutation.mutateAsync({
        uploadUrl: currentAttempt.uploadUrl,
        file: currentAttempt.file
      });
    } catch (error) {
      failAttempt("upload", error);
      return;
    }

    await confirmAttempt(currentAttempt);
  }

  async function startUpload(values: ModuleUploadFormValues) {
    const fileExtension = getModuleFileExtension(values.file.name);

    if (!fileExtension) {
      form.setError("file", {
        message: "Only PDF and DOCX files are allowed"
      });
      return;
    }

    resetMutations();
    setAttempt(null);
    setAttemptExpired(false);
    setFailedStage(null);
    setErrorMessage(null);
    setStage("requesting");

    try {
      const uploadIntent = await presignMutation.mutateAsync({
        title: values.title,
        description: values.description,
        file_extension: fileExtension
      });

      const nextAttempt: UploadAttempt = {
        title: values.title,
        description: values.description,
        file: values.file,
        uploadUrl: uploadIntent.upload_url,
        fileKey: uploadIntent.file_key,
        requestedAt: getCurrentTimestamp()
      };

      setAttempt(nextAttempt);
      await uploadAndConfirm(nextAttempt);
    } catch (error) {
      failAttempt("presign", error);
    }
  }

  function retryFailedStage() {
    if (failedStage === "presign") {
      void form.handleSubmit(startUpload)();
      return;
    }

    if (!attempt || !failedStage) {
      return;
    }

    const isExpired =
      getCurrentTimestamp() - attempt.requestedAt >= SAFE_RETRY_WINDOW_MS;

    if (isExpired) {
      setAttemptExpired(true);
      setErrorMessage(
        "This upload attempt is too old to retry safely. Discard it and request a new link."
      );
      focusStatus();
      return;
    }

    setAttemptExpired(false);
    setErrorMessage(null);

    if (failedStage === "upload") {
      void uploadAndConfirm(attempt);
      return;
    }

    void confirmAttempt(attempt);
  }

  function discardAttempt() {
    resetMutations();
    setAttempt(null);
    setAttemptExpired(false);
    setFailedStage(null);
    setErrorMessage(null);
    setStage("idle");

    requestAnimationFrame(() => {
      document.getElementById(`module-upload-title-${generatedId}`)?.focus();
    });
  }

  return (
    <section
      aria-labelledby={`module-upload-heading-${generatedId}`}
      className="mt-5 rounded-3xl border border-slate-200
          bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center
              justify-center rounded-xl bg-emerald-50
              text-emerald-700"
        >
          <FileUp className="h-5 w-5" aria-hidden="true" />
        </span>

        <div>
          <h3
            id={`module-upload-heading-${generatedId}`}
            className="font-semibold text-slate-950"
          >
            Upload a module
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Upload lab guides or manuals (PDF or DOCX, up to 25 MiB). Saved as a draft until published.
          </p>
        </div>
      </div>

      <form
        noValidate
        onSubmit={form.handleSubmit(startUpload)}
        aria-busy={isBusy}
        className="mt-5 space-y-5"
      >
        {busyMessage ? (
          <p
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 rounded-xl
                bg-slate-100 px-4 py-3 text-sm text-slate-700"
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {busyMessage}
          </p>
        ) : null}

        {stage === "failed" && errorMessage ? (
          <div
            id={statusId}
            role="alert"
            tabIndex={-1}
            className="rounded-xl border border-red-200
                bg-red-50 px-4 py-3"
          >
            <div className="flex items-start gap-2">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0
                    text-red-600"
                aria-hidden="true"
              />
              <p className="text-sm leading-6 text-red-800">{errorMessage}</p>
            </div>

            {failedStage === "confirm" ? (
              <p className="mt-2 text-xs leading-5 text-red-700">
                Confirmation may have completed even if its response was
                interrupted. Refresh the module list before starting a separate
                upload.
              </p>
            ) : null}
          </div>
        ) : null}

        {stage === "complete" ? (
          <p
            id={statusId}
            role="status"
            tabIndex={-1}
            className="flex items-center gap-2 rounded-xl
                bg-emerald-50 px-4 py-3 text-sm
                text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Module uploaded! Saved as draft.
          </p>
        ) : null}

        <fieldset
          disabled={fieldsDisabled}
          className="space-y-5 disabled:opacity-70"
        >
          <div className="space-y-2">
            <label
              htmlFor={`module-upload-title-${generatedId}`}
              className="text-sm font-medium text-slate-800"
            >
              Title
            </label>

            <input
              id={`module-upload-title-${generatedId}`}
              type="text"
              maxLength={255}
              placeholder="Example: Module 1 — Introduction"
              aria-invalid={Boolean(form.formState.errors.title)}
              aria-describedby={
                form.formState.errors.title
                  ? `module-upload-title-error-${generatedId}`
                  : undefined
              }
              className="h-11 w-full rounded-xl border
                  border-slate-200 bg-white px-3 text-sm
                  text-slate-950 outline-none transition
                  placeholder:text-slate-400
                  focus:border-emerald-500
                  focus:ring-4 focus:ring-emerald-50
                  disabled:cursor-not-allowed
                  disabled:bg-slate-50"
              {...form.register("title")}
            />

            {form.formState.errors.title ? (
              <p
                id={`module-upload-title-error-${generatedId}`}
                className="text-sm text-red-600"
              >
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor={`module-upload-description-${generatedId}`}
              className="text-sm font-medium text-slate-800"
            >
              Description
              <span className="ml-1 font-normal text-slate-500">
                (optional)
              </span>
            </label>

            <textarea
              id={`module-upload-description-${generatedId}`}
              rows={4}
              maxLength={500}
              placeholder="Summarize what students should learn."
              aria-invalid={Boolean(form.formState.errors.description)}
              aria-describedby={
                form.formState.errors.description
                  ? `module-upload-description-error-${generatedId}`
                  : undefined
              }
              className="w-full resize-y rounded-xl border
                  border-slate-200 bg-white px-3 py-3 text-sm
                  leading-6 text-slate-950 outline-none transition
                  placeholder:text-slate-400
                  focus:border-emerald-500
                  focus:ring-4 focus:ring-emerald-50
                  disabled:cursor-not-allowed
                  disabled:bg-slate-50"
              {...form.register("description")}
            />

            {form.formState.errors.description ? (
              <p
                id={`module-upload-description-error-${generatedId}`}
                className="text-sm text-red-600"
              >
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor={`module-upload-file-${generatedId}`}
              className="text-sm font-medium text-slate-800"
            >
              Module file
            </label>
            <Controller
              name="file"
              control={form.control}
              render={({ field }) => (
                <input
                  key={fileInputKey}
                  id={`module-upload-file-${generatedId}`}
                  name={field.name}
                  ref={field.ref}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(event.target.files?.[0])}
                  aria-invalid={Boolean(form.formState.errors.file)}
                  aria-describedby={
                    form.formState.errors.file
                      ? `module-upload-file-error-${generatedId}`
                      : `module-upload-file-help-${generatedId}`
                  }
                  className="block min-h-11 w-full rounded-xl
                      border border-slate-200 bg-white px-3 py-2
                      text-sm text-slate-700
                      file:mr-3 file:rounded-lg file:border-0
                      file:bg-slate-100 file:px-3 file:py-1.5
                      file:text-sm file:font-semibold
                      file:text-slate-700
                      focus-visible:outline-2
                      focus-visible:outline-offset-2
                      focus-visible:outline-emerald-700
                      disabled:cursor-not-allowed
                      disabled:bg-slate-50"
                />
              )}
            />

            <p
              id={`module-upload-file-help-${generatedId}`}
              className="text-xs leading-5 text-slate-500"
            >
              PDF or DOCX, up to 25 MiB.
            </p>

            {form.formState.errors.file ? (
              <p
                id={`module-upload-file-error-${generatedId}`}
                className="text-sm text-red-600"
              >
                {form.formState.errors.file.message}
              </p>
            ) : null}
          </div>
        </fieldset>
        <div className="flex flex-wrap justify-end gap-3">
          {stage === "failed" ? (
            <>
              <button
                type="button"
                onClick={discardAttempt}
                disabled={isBusy}
                className="inline-flex min-h-11 items-center
                    gap-2 rounded-xl border border-slate-300
                    bg-white px-4 text-sm font-semibold
                    text-slate-800 transition hover:bg-slate-50
                    focus-visible:outline-2
                    focus-visible:outline-offset-2
                    focus-visible:outline-slate-700
                    disabled:cursor-not-allowed
                    disabled:opacity-60"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Discard
              </button>

              <button
                type="button"
                onClick={retryFailedStage}
                disabled={isBusy || attemptExpired}
                className="inline-flex min-h-11 items-center
                    gap-2 rounded-xl bg-amber-700 px-4
                    text-sm font-semibold text-white transition
                    hover:bg-amber-800 focus-visible:outline-2
                    focus-visible:outline-offset-2
                    focus-visible:outline-amber-700
                    disabled:cursor-not-allowed
                    disabled:opacity-60"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Retry upload
              </button>
            </>
          ) : null}
          <button
            type="submit"
            disabled={isBusy || stage === "failed"}
            className="inline-flex min-h-11 items-center
                justify-center rounded-xl bg-emerald-700 px-5
                text-sm font-semibold text-white transition
                hover:bg-emerald-800 focus-visible:outline-2
                focus-visible:outline-offset-2
                focus-visible:outline-emerald-700
                disabled:cursor-not-allowed
                disabled:opacity-60"
          >
            {isBusy ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Uploading...
              </>
            ) : (
              "Upload draft"
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
