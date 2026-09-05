"use client";

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import type { Assignment } from "@/features/admin/types";
import { useModalFocusTrap } from "@/hooks/use-modal-focus-trap";

interface CourseAssignmentModalProps {
  isOpen: boolean;
  courseCode: string;
  editingAssignment: Assignment | null;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    max_points: number;
    allowed_file_types: string;
    due_date?: string | null;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

const FORMAT_OPTIONS = [
  { id: "pdf", label: "PDF (.pdf)" },
  { id: "zip", label: "ZIP (.zip)" },
  { id: "rar", label: "RAR (.rar)" },
  { id: "docx", label: "Word (.docx)" },
  { id: "py", label: "Python (.py)" },
  { id: "java", label: "Java (.java)" },
  { id: "cpp", label: "C++ (.cpp)" },
  { id: "sql", label: "SQL (.sql)" },
  { id: "ipynb", label: "Jupyter (.ipynb)" },
];

function formatDatetimeLocal(isoString?: string | null): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function AssignmentFormInner({
  courseCode,
  editingAssignment,
  onClose,
  onSubmit,
  isSubmitting,
}: Omit<CourseAssignmentModalProps, "isOpen">) {
  const [title, setTitle] = useState(editingAssignment?.title ?? "");
  const [description, setDescription] = useState(editingAssignment?.description ?? "");
  const [maxPoints, setMaxPoints] = useState<number>(editingAssignment?.max_points ?? 100);
  const [allowedTypes, setAllowedTypes] = useState(
    editingAssignment?.allowed_file_types ?? "pdf,zip"
  );
  const [dueDate, setDueDate] = useState(formatDatetimeLocal(editingAssignment?.due_date));
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setFormError(null);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        max_points: maxPoints,
        allowed_file_types: allowedTypes,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Couldn't save assignment. Please try again."
      );
    }
  };

  const activeTypesList = allowedTypes
    .split(",")
    .map((t) => t.trim().toLowerCase().replace(/^\./, ""))
    .filter(Boolean);

  const toggleFormat = (formatId: string) => {
    const currentSet = new Set(activeTypesList);
    if (currentSet.has(formatId)) {
      currentSet.delete(formatId);
    } else {
      currentSet.add(formatId);
    }
    const newTypes = Array.from(currentSet);
    setAllowedTypes(newTypes.length > 0 ? newTypes.join(",") : "pdf");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-apple-modal"
    >
      <div>
        <h4 id="assignment-modal-title" className="font-bold text-sm text-slate-900">
          {editingAssignment ? "Edit Assignment" : "New Assignment"}
        </h4>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {editingAssignment
            ? `Update details and deadlines for ${courseCode}.`
            : `Create coursework or a lab task for ${courseCode}.`}
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-medium"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="flex-1">{formError}</span>
        </div>
      )}

      <div className="space-y-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-600 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Assignment 1 - Responsive Layout"
            className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 transition-shadow duration-150"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-600 mb-1">Instructions / Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 resize-none transition-shadow duration-150"
            placeholder="Add instructions, guidelines, or requirements..."
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-600 mb-1">Max Points</label>
          <input
            type="number"
            value={maxPoints}
            onChange={(e) => setMaxPoints(Number(e.target.value))}
            required
            min={1}
            max={1000}
            className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 transition-shadow duration-150"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">
            Allowed Submission Formats *
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {FORMAT_OPTIONS.map((fmt) => {
              const isSelected = activeTypesList.includes(fmt.id);

              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => toggleFormat(fmt.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer select-none ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80"
                  }`}
                >
                  <span>{fmt.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 shrink-0">Selected / Custom:</span>
            <input
              type="text"
              value={allowedTypes}
              onChange={(e) => setAllowedTypes(e.target.value)}
              placeholder="e.g. pdf,zip,docx"
              className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-700 focus:bg-white focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-600 mb-1">Due Date & Time (Optional)</label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 transition-shadow duration-150"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-50 apple-press transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 shadow-xs apple-press transition-all"
        >
          {isSubmitting ? "Saving..." : editingAssignment ? "Save Changes" : "Create Assignment"}
        </button>
      </div>
    </form>
  );
}

export function CourseAssignmentModal(props: CourseAssignmentModalProps) {
  const modalRef = useModalFocusTrap<HTMLDivElement>({
    isOpen: props.isOpen,
    onClose: props.onClose,
  });

  if (!props.isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assignment-modal-title"
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
    >
      <AssignmentFormInner
        key={props.editingAssignment?.id ?? "create"}
        courseCode={props.courseCode}
        editingAssignment={props.editingAssignment}
        onClose={props.onClose}
        onSubmit={props.onSubmit}
        isSubmitting={props.isSubmitting}
      />
    </div>
  );
}
