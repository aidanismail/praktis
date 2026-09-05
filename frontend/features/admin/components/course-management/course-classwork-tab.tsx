"use client";

import React, { useState } from "react";
import {
  Award,
  BookOpen,
  Download,
  Eye,
  FileCheck,
  FileText,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import type {
  Course,
  Assignment,
  CourseModule,
  ModUploadQueueItem,
  ModUploadProgress,
} from "@/features/admin/types";
import { createAndUploadMultipleModules } from "@/features/admin/api/admin.api";
import { useModalFocusTrap } from "@/hooks/use-modal-focus-trap";

interface CourseClassworkTabProps {
  course: Course;
  assignments: Assignment[];
  modules: CourseModule[];
  onOpenSubmissions: (assignment: Assignment) => void;
  onOpenCreateAssignment: () => void;
  onOpenEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => Promise<void>;
  onDeleteModule: (moduleId: string) => Promise<void>;
  onUploadModulesSuccess: () => void;
  onPreviewDoc: (doc: {
    title: string;
    fileUrl: string;
    fileExtension: string;
    courseCode: string;
  }) => void;
  onError?: (msg: string) => void;
  onSuccess?: (msg: string) => void;
}

export function CourseClassworkTab({
  course,
  assignments,
  modules,
  onOpenSubmissions,
  onOpenCreateAssignment,
  onOpenEditAssignment,
  onDeleteAssignment,
  onDeleteModule,
  onUploadModulesSuccess,
  onPreviewDoc,
  onError,
  onSuccess,
}: CourseClassworkTabProps) {
  // Module Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [modUploadQueue, setModUploadQueue] = useState<ModUploadQueueItem[]>([]);
  const [isDraggingMod, setIsDraggingMod] = useState(false);
  const [isUploadingMod, setIsUploadingMod] = useState(false);
  const [modUploadProgress, setModUploadProgress] = useState<ModUploadProgress | null>(null);

  const uploadModalRef = useModalFocusTrap<HTMLDivElement>({
    isOpen: showUploadModal,
    onClose: () => {
      if (!isUploadingMod) {
        setShowUploadModal(false);
        setModUploadQueue([]);
      }
    },
  });

  const addModFilesToQueue = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    const validExts = [".pdf", ".docx"];

    Array.from(files).forEach((file) => {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (validExts.includes(ext)) {
        if (file.size <= 20 * 1024 * 1024) {
          validFiles.push(file);
        } else {
          onError?.(`"${file.name}" is over 20 MB. Try compressing it or picking a smaller file.`);
        }
      } else {
        onError?.(`"${file.name}" must be a .pdf or .docx file.`);
      }
    });

    if (validFiles.length > 0) {
      setModUploadQueue((prev) => [
        ...prev,
        ...validFiles.map((file) => {
          const cleanTitle = file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/[_-]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          return {
            file,
            title: cleanTitle.length > 0 ? cleanTitle : file.name,
            description: "",
          };
        }),
      ]);
    }
  };

  const handleUploadModules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modUploadQueue.length === 0) return;

    setIsUploadingMod(true);
    setModUploadProgress(null);

    try {
      const result = await createAndUploadMultipleModules(
        course.id,
        modUploadQueue,
        (current, total, currentFileName) => {
          setModUploadProgress({ current, total, currentFileName });
        }
      );

      if (result.successCount > 0 && result.errors.length === 0) {
        onSuccess?.(
          `Uploaded ${result.successCount} learning ${
            result.successCount === 1 ? "module" : "modules"
          }.`
        );
        setShowUploadModal(false);
        setModUploadQueue([]);
        onUploadModulesSuccess();
      } else if (result.successCount > 0 && result.errors.length > 0) {
        onSuccess?.(`Uploaded ${result.successCount} of ${result.total} modules.`);
        const failedFilenames = new Set(result.errors.map((err) => err.filename));
        setModUploadQueue((prev) =>
          prev.filter((item) => failedFilenames.has(item.file.name))
        );
        onError?.(result.errors.map((err) => `${err.filename}: ${err.error}`).join(" | "));
        onUploadModulesSuccess();
      } else {
        onError?.(`Couldn't upload modules: ${result.errors.map((err) => err.error).join(", ")}`);
      }
    } catch (err: unknown) {
      onError?.(err instanceof Error ? err.message : "Couldn't complete the batch upload. Please try again.");
    } finally {
      setIsUploadingMod(false);
      setModUploadProgress(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Classwork & Materials</h3>
          <p className="text-xs text-slate-500">
            Assignments, lab tasks, and downloadable modules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-full shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Module</span>
          </button>
          <button
            type="button"
            onClick={onOpenCreateAssignment}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full shadow-xs apple-press transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Assignment</span>
          </button>
        </div>
      </div>

      {/* Section 1: Assignments */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-slate-700" />
            <span>Assignments & Tasks ({assignments.length})</span>
          </h4>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center p-8 bg-white border border-dashed border-slate-200 rounded-3xl text-xs text-slate-400">
            No assignments yet. Click &quot;Create Assignment&quot; to post coursework.
          </div>
        ) : (
          <div className="space-y-2.5">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{a.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {a.due_date
                        ? `Due: ${new Date(a.due_date).toLocaleString()}`
                        : "No due date"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => onOpenSubmissions(a)}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full text-xs flex items-center gap-1.5 apple-press transition-colors shadow-xs"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Submissions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenEditAssignment(a)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs apple-press transition-colors"
                    title="Edit assignment"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteAssignment(a.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs apple-press transition-colors"
                    title="Delete assignment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Learning Modules */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-slate-700" />
            <span>Learning Materials & Modules ({modules.length})</span>
          </h4>
        </div>

        {modules.length === 0 ? (
          <div className="text-center p-8 bg-white border border-dashed border-slate-200 rounded-3xl text-xs text-slate-400">
            No learning modules uploaded yet. Click &quot;Upload Module&quot; to add guides and docs.
          </div>
        ) : (
          <div className="space-y-2.5">
            {modules.map((m) => (
              <div
                key={m.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{m.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {m.description || "No description yet."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {m.download_url && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          onPreviewDoc({
                            title: m.title,
                            fileUrl: m.download_url!,
                            fileExtension: m.file_key.split(".").pop() || "pdf",
                            courseCode: course.code,
                          })
                        }
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <a
                        href={m.download_url}
                        download
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-full text-xs flex items-center gap-1.5 transition-colors"
                        title="Download original file"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </a>
                    </>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      m.is_published
                        ? "bg-slate-100 text-slate-800 border border-slate-200"
                        : "bg-slate-50 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {m.is_published ? "Published" : "Draft"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteModule(m.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs apple-press transition-colors"
                    title="Delete module"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Module Modal */}
      {showUploadModal && (
        <div
          ref={uploadModalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-module-modal-title"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleUploadModules}
            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 id="upload-module-modal-title" className="font-bold text-sm text-slate-900">
                  Upload Learning Modules
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Course: {course.code} - {course.name} ({course.academic_year}{" "}
                  {course.semester})
                </p>
              </div>
              <button
                type="button"
                disabled={isUploadingMod}
                onClick={() => {
                  setShowUploadModal(false);
                  setModUploadQueue([]);
                }}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              {/* Drag-and-drop / Multi-file Picker */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Modules (.pdf, .docx up to 20MB) *
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingMod(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDraggingMod(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingMod(false);
                    if (e.dataTransfer.files) {
                      addModFilesToQueue(e.dataTransfer.files);
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center transition-colors ${
                    isDraggingMod
                      ? "border-slate-900 bg-slate-100"
                      : "border-slate-200 hover:border-slate-400 bg-slate-50/50"
                  }`}
                >
                  <label className="cursor-pointer flex flex-col items-center justify-center gap-1.5 py-2">
                    <UploadCloud className="w-8 h-8 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-800">
                      Click to browse or drag and drop files here
                    </span>
                    <span className="text-[10px] text-slate-400">
                      PDF and DOCX supported (hold Shift or Ctrl to select multiple)
                    </span>
                    <input
                      type="file"
                      multiple
                      disabled={isUploadingMod}
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => {
                        if (e.target.files) {
                          addModFilesToQueue(e.target.files);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Queued Modules List */}
              {modUploadQueue.length > 0 && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-slate-700 font-semibold border-b border-slate-100 pb-1.5">
                    <span>Queued Modules ({modUploadQueue.length})</span>
                    <button
                      type="button"
                      disabled={isUploadingMod}
                      onClick={() => setModUploadQueue([])}
                      className="text-[11px] text-rose-600 hover:underline font-normal"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {modUploadQueue.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 relative group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-semibold text-slate-900 text-xs truncate">
                              {item.file.name}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              ({(item.file.size / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                          </div>
                          {!isUploadingMod && (
                            <button
                              type="button"
                              onClick={() => {
                                setModUploadQueue((prev) => prev.filter((_, i) => i !== idx));
                              }}
                              className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <input
                            type="text"
                            required
                            disabled={isUploadingMod}
                            value={item.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setModUploadQueue((prev) =>
                                prev.map((q, i) => (i === idx ? { ...q, title: val } : q))
                              );
                            }}
                            placeholder="Module title *"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-slate-900"
                          />
                          <input
                            type="text"
                            disabled={isUploadingMod}
                            value={item.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              setModUploadQueue((prev) =>
                                prev.map((q, i) =>
                                  i === idx ? { ...q, description: val } : q
                                )
                              );
                            }}
                            placeholder="Brief description or notes (optional)"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 focus:ring-1 focus:ring-slate-900"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Progress Indicator */}
              {isUploadingMod && modUploadProgress && (
                <div className="space-y-1.5 bg-slate-900 text-white p-3 rounded-2xl">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span>
                      Uploading {modUploadProgress.current} of {modUploadProgress.total}...
                    </span>
                    <span>
                      {Math.round((modUploadProgress.current / modUploadProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-200"
                      style={{
                        width: `${
                          (modUploadProgress.current / modUploadProgress.total) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    Current: {modUploadProgress.currentFileName}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isUploadingMod}
                onClick={() => {
                  setShowUploadModal(false);
                  setModUploadQueue([]);
                }}
                className="px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isUploadingMod ||
                  modUploadQueue.length === 0 ||
                  modUploadQueue.some((item) => !item.title.trim())
                }
                className="px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition-all"
              >
                {isUploadingMod ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload {modUploadQueue.length} {modUploadQueue.length === 1 ? "module" : "modules"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

