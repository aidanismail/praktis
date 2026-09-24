"use client";

import { useRef, useState, type ChangeEvent, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AsteriskLoader } from "@/components/ui/asterisk-loader";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { ApiError } from "@/lib/api/client";
import {
  useDeleteCourseModule,
  useReplaceCourseModuleFile,
  useSetCourseModulePublication,
  useUpdateCourseModule,
} from "../hooks/use-course-modules";
import {
  moduleMetadataSchema,
  type ModuleMetadataFormValues,
} from "../schemas/module.schema";
import type { CourseModule } from "../types/module.type";
import {
  ArrowSquareOut,
  X
} from "@phosphor-icons/react";

type ModuleCardProps = {
  userId: string;
  courseId: string;
  module: CourseModule;
  accessMode: "manage" | "read-only";
};

const MAX_REPLACE_FILE_BYTES = 50 * 1024 * 1024; // 50MB

const moduleDateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatModuleDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : moduleDateFormatter.format(date);
}

function getFileTypeBadge(fileKey?: string | null, downloadUrl?: string | null) {
  const ref = (fileKey ?? downloadUrl ?? "").toLowerCase();
  if (ref.includes(".pdf")) return "PDF";
  if (ref.includes(".docx")) return "DOCX";
  return "DOC";
}

function getUpdateErrorMessage(error: Error) {
  if (!(error instanceof ApiError)) {
    return "Unable to update module. Please try again.";
  }
  if (error.status === 401) return "Your session has expired. Please sign in again.";
  if (error.status === 403) return "You do not have permission to update this module.";
  if (error.status === 404) return "Module not found.";
  if (error.status === 400 || error.status === 422) return "Please correct the errors in the form.";
  return "Unable to connect to the server. Please try again.";
}

export function ModuleCard({ userId, courseId, module, accessMode }: ModuleCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplacingFile, setIsReplacingFile] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileType = getFileTypeBadge(module.file_key, module.download_url);
  const isPdf = fileType === "PDF";
  const expectedExt = isPdf ? ".pdf" : ".docx";
  const acceptMime = isPdf
    ? "application/pdf,.pdf"
    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx";

  const publishMutation = useSetCourseModulePublication({ userId, courseId });
  const deleteMutation = useDeleteCourseModule({ userId, courseId });
  const replaceMutation = useReplaceCourseModuleFile({ userId, courseId });
  const updateMutation = useUpdateCourseModule({ userId, courseId });

  const form = useForm<ModuleMetadataFormValues>({
    resolver: zodResolver(moduleMetadataSchema),
    defaultValues: {
      title: module.title,
      description: module.description ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      title: module.title,
      description: module.description ?? "",
    });
  }, [form, module]);

  function changePublication() {
    publishMutation.reset();
    publishMutation.mutate({ moduleId: module.id, publish: !module.is_published });
  }

  function handleFileSelection(e: ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setReplacementFile(null);
      return;
    }

    const lowerName = file.name.toLowerCase();
    if (isPdf && !lowerName.endsWith(".pdf")) {
      setFileError("Replacement file must be a PDF (.pdf) document.");
      setReplacementFile(null);
      return;
    }
    if (!isPdf && !lowerName.endsWith(".docx")) {
      setFileError("Replacement file must be a Word (.docx) document.");
      setReplacementFile(null);
      return;
    }

    if (file.size > MAX_REPLACE_FILE_BYTES) {
      setFileError("File size exceeds 50MB limit.");
      setReplacementFile(null);
      return;
    }

    setReplacementFile(file);
  }

  async function handleConfirmReplacement() {
    if (!replacementFile) return;
    setFileError(null);
    replaceMutation.reset();

    try {
      await replaceMutation.mutateAsync({
        moduleId: module.id,
        file: replacementFile,
      });
      setIsReplacingFile(false);
      setReplacementFile(null);
    } catch {
      // Handled via replaceMutation.error
    }
  }

  function cancelReplacement() {
    setIsReplacingFile(false);
    setReplacementFile(null);
    setFileError(null);
    replaceMutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onEditSubmit(values: ModuleMetadataFormValues) {
    updateMutation.reset();
    updateMutation.mutate(
      {
        moduleId: module.id,
        payload: {
          title: values.title,
          description: values.description,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
      {/* Top Header: Typographic Status, Format, Date, and Open File Link */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`font-semibold ${
              module.is_published ? "text-slate-900" : "text-amber-700"
            }`}
          >
            {accessMode === "read-only"
              ? "Available"
              : module.is_published
                ? "Published"
                : "Draft"}
          </span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {fileType}
          </span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <time dateTime={module.created_at} className="text-slate-400 text-[11px]">
            {formatModuleDate(module.created_at)}
          </time>
        </div>

        <a
          href={module.download_url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${module.title} in a new tab`}
          className="apple-press inline-flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-slate-950 transition-colors group"
        >
          <span>Open file</span>
          <ArrowSquareOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
        </a>
      </div>

      {/* Main Content: Title + Description */}
      {!isEditing ? (
        <div className="mt-3">
          <h3 className="text-sm sm:text-base font-bold text-slate-950 tracking-tight wrap-break-word">
            {module.title}
          </h3>
          {module.description ? (
            <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed wrap-break-word">
              {module.description}
            </p>
          ) : null}
        </div>
      ) : (
        /* Inline Edit Form */
        <form
          noValidate
          onSubmit={form.handleSubmit(onEditSubmit)}
          className="mt-3 space-y-3 rounded-xl bg-slate-50/80 p-3.5 border border-slate-200/80"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-950">Edit module details</h4>
            <button
              type="button"
              onClick={() => {
                updateMutation.reset();
                form.reset({ title: module.title, description: module.description ?? "" });
                setIsEditing(false);
              }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Cancel editing"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {updateMutation.isError ? (
            <NotificationBanner
              variant="error"
              message={getUpdateErrorMessage(updateMutation.error)}
            />
          ) : null}

          <div>
            <label
              htmlFor={`edit-title-${module.id}`}
              className="text-xs font-semibold text-slate-700"
            >
              Title
            </label>
            <input
              id={`edit-title-${module.id}`}
              type="text"
              maxLength={255}
              disabled={updateMutation.isPending}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              {...form.register("title")}
            />
            {form.formState.errors.title ? (
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={`edit-desc-${module.id}`}
              className="text-xs font-semibold text-slate-700"
            >
              Description <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id={`edit-desc-${module.id}`}
              rows={3}
              maxLength={2000}
              disabled={updateMutation.isPending}
              className="mt-1 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              {...form.register("description")}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                updateMutation.reset();
                form.reset({ title: module.title, description: module.description ?? "" });
                setIsEditing(false);
              }}
              disabled={updateMutation.isPending}
              className="apple-press rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="apple-press inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs transition-colors disabled:opacity-60"
            >
              {updateMutation.isPending ? <AsteriskLoader className="h-3.5 w-3.5" /> : null}
              <span>{updateMutation.isPending ? "Saving..." : "Save changes"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Inline Replace File Panel */}
      {isReplacingFile ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-950">Replace module file</p>
            <button
              type="button"
              onClick={cancelReplacement}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Cancel file replacement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Select a new {expectedExt.toUpperCase()} file (up to 50MB). The existing file will be replaced immediately.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptMime}
            onChange={handleFileSelection}
            disabled={replaceMutation.isPending}
            className="mt-2.5 block w-full text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200/70 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-slate-800 hover:file:bg-slate-300 focus-visible:outline-none disabled:opacity-60"
          />

          {fileError ? (
            <p role="alert" className="mt-1.5 text-xs text-red-600">
              {fileError}
            </p>
          ) : null}

          {replaceMutation.isError ? (
            <div className="mt-2">
              <NotificationBanner
                variant="error"
                message={
                  replaceMutation.error instanceof ApiError
                    ? replaceMutation.error.message
                    : "Unable to replace file. Please try again."
                }
              />
            </div>
          ) : null}

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={cancelReplacement}
              disabled={replaceMutation.isPending}
              className="apple-press rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReplacement}
              disabled={!replacementFile || replaceMutation.isPending}
              className="apple-press inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {replaceMutation.isPending ? <AsteriskLoader className="h-3.5 w-3.5" /> : null}
              <span>{replaceMutation.isPending ? "Uploading..." : "Replace file"}</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Inline Delete Confirmation Alert */}
      {isConfirmingDelete ? (
        <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50/80 p-3.5">
          <p className="text-xs font-semibold text-red-950">Delete this module?</p>
          <p className="mt-0.5 text-xs text-red-800">
            This module and its document will be permanently deleted. This action cannot be undone.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              disabled={deleteMutation.isPending}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(module.id)}
              disabled={deleteMutation.isPending}
              className="rounded-full bg-red-700 px-3 py-1 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-60 transition-colors"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
          {deleteMutation.isError ? (
            <div className="mt-2">
              <NotificationBanner
                variant="error"
                message={
                  deleteMutation.error instanceof ApiError
                    ? deleteMutation.error.message
                    : "Unable to delete module. Please try again."
                }
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {publishMutation.isError ? (
        <div className="mt-2">
          <NotificationBanner
            variant="error"
            message={
              publishMutation.error instanceof ApiError
                ? publishMutation.error.message
                : "Unable to update module visibility. Please try again."
            }
          />
        </div>
      ) : null}

      {/* Instructor Management Toolbar */}
      {accessMode === "manage" ? (
        <div className="mt-3.5 flex items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
          {/* Primary Publication Toggle */}
          <button
            type="button"
            onClick={changePublication}
            disabled={publishMutation.isPending}
            className={
              module.is_published
                ? "apple-press inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-60 transition-colors"
                : "apple-press inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-60 transition-colors"
            }
          >
            {publishMutation.isPending ? (
              <AsteriskLoader className="h-3.5 w-3.5" />
            ) : null}
            <span>
              {publishMutation.isPending
                ? "Updating..."
                : module.is_published
                  ? "Unpublish"
                  : "Publish module"}
            </span>
          </button>

          {/* Secondary Actions (Clean Typography, no bulky pills) */}
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setIsReplacingFile(false);
                setIsConfirmingDelete(false);
              }}
              disabled={publishMutation.isPending}
              className="text-slate-500 hover:text-slate-900 font-medium px-1.5 py-0.5 transition-colors rounded hover:bg-slate-50"
            >
              Edit
            </button>

            <span className="text-slate-200" aria-hidden="true">·</span>

            <button
              type="button"
              onClick={() => {
                replaceMutation.reset();
                setIsReplacingFile(true);
                setIsEditing(false);
                setIsConfirmingDelete(false);
              }}
              disabled={publishMutation.isPending || deleteMutation.isPending}
              className="text-slate-500 hover:text-slate-900 font-medium px-1.5 py-0.5 transition-colors rounded hover:bg-slate-50"
            >
              Replace file
            </button>

            <span className="text-slate-200" aria-hidden="true">·</span>

            <button
              type="button"
              onClick={() => {
                deleteMutation.reset();
                setIsConfirmingDelete(true);
                setIsEditing(false);
                setIsReplacingFile(false);
              }}
              disabled={publishMutation.isPending || deleteMutation.isPending}
              className="text-slate-400 hover:text-red-600 font-medium px-1.5 py-0.5 transition-colors rounded hover:bg-red-50/50"
            >
              Delete
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
