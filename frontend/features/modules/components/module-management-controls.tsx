"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ApiError } from "@/lib/api/client";
import {
  useDeleteCourseModule,
  useReplaceCourseModuleFile,
  useSetCourseModulePublication
} from "../hooks/use-course-modules";
import type { CourseModule } from "../types/module.type";
import { ModuleEditor } from "./module-editor";

type ModuleManagementControlsProps = {
  userId: string;
  courseId: string;
  module: CourseModule;
};

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB

export function ModuleManagementControls({
  userId,
  courseId,
  module
}: ModuleManagementControlsProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isReplacingFile, setIsReplacingFile] = useState(false);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const publishMutation = useSetCourseModulePublication({ userId, courseId });
  const deleteMutation = useDeleteCourseModule({ userId, courseId });
  const replaceMutation = useReplaceCourseModuleFile({ userId, courseId });

  const fileRef = module.file_key ?? module.download_url ?? "";
  const isPdf = fileRef.toLowerCase().includes(".pdf");
  const expectedExt = isPdf ? ".pdf" : ".docx";
  const acceptMime = isPdf
    ? "application/pdf,.pdf"
    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx";

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

    if (file.size > MAX_FILE_BYTES) {
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
        file: replacementFile
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

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      {/* Primary Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={changePublication}
          disabled={publishMutation.isPending}
          className={
            module.is_published
              ? "inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 transition hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:opacity-60"
              : "inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-60"
          }
        >
          {publishMutation.isPending
            ? "Updating..."
            : module.is_published
              ? "Unpublish module"
              : "Publish module"}
        </button>

        <button
          type="button"
          onClick={() => {
            replaceMutation.reset();
            setIsReplacingFile(true);
            setIsConfirmingDelete(false);
          }}
          disabled={publishMutation.isPending || deleteMutation.isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:opacity-60"
        >
          Replace file
        </button>

        {!isConfirmingDelete ? (
          <button
            type="button"
            onClick={() => {
              deleteMutation.reset();
              setIsConfirmingDelete(true);
              setIsReplacingFile(false);
            }}
            disabled={publishMutation.isPending || deleteMutation.isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-60"
          >
            Delete module
          </button>
        ) : null}
      </div>

      {publishMutation.isError ? (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {publishMutation.error instanceof ApiError
            ? publishMutation.error.message
            : "Unable to update module visibility. Please try again."}
        </p>
      ) : null}

      {/* Delete Confirmation */}
      {isConfirmingDelete ? (
        <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-950">Delete module?</p>
          <p className="mt-1 text-sm text-red-800">
            This module and its file will be permanently deleted. This action cannot be undone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              disabled={deleteMutation.isPending}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(module.id)}
              disabled={deleteMutation.isPending}
              className="rounded-xl bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
          {deleteMutation.isError ? (
            <p className="mt-3 text-sm text-red-800">
              {deleteMutation.error instanceof ApiError
                ? deleteMutation.error.message
                : "Unable to delete module. Please try again."}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Replace File Panel */}
      {isReplacingFile ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">Replace module file</p>
          <p className="mt-1 text-sm text-slate-600">
            Select a new {expectedExt.toUpperCase()} file (up to 50MB). The existing file will be replaced immediately.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptMime}
            onChange={handleFileSelection}
            disabled={replaceMutation.isPending}
            className="mt-3 block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border file:border-slate-300 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-800 hover:file:bg-slate-50 focus-visible:outline-none disabled:opacity-60"
          />

          {fileError ? (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {fileError}
            </p>
          ) : null}

          {replaceMutation.isError ? (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {replaceMutation.error instanceof ApiError
                ? replaceMutation.error.message
                : "Unable to replace file. Please try again."}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={cancelReplacement}
              disabled={replaceMutation.isPending}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReplacement}
              disabled={!replacementFile || replaceMutation.isPending}
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {replaceMutation.isPending ? "Uploading replacement file..." : "Replace file"}
            </button>
          </div>
        </div>
      ) : null}

      <ModuleEditor userId={userId} courseId={courseId} module={module} />
    </div>
  );
}
