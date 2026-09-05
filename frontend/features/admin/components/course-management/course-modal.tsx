"use client";

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import type { Course } from "@/features/admin/types";
import { useModalFocusTrap } from "@/hooks/use-modal-focus-trap";

interface CourseModalProps {
  isOpen: boolean;
  initialCourse: Course | null;
  onClose: () => void;
  onSubmit: (data: {
    code: string;
    name: string;
    academic_year: string;
    semester: "Ganjil" | "Genap";
    is_active?: boolean;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

function CourseFormInner({
  initialCourse,
  onClose,
  onSubmit,
  isSubmitting,
}: Omit<CourseModalProps, "isOpen">) {
  const isEdit = initialCourse !== null;
  const [code, setCode] = useState(initialCourse?.code ?? "");
  const [name, setName] = useState(initialCourse?.name ?? "");
  const [academicYear, setAcademicYear] = useState(initialCourse?.academic_year ?? "2025/2026");
  const [semester, setSemester] = useState<"Ganjil" | "Genap">(
    (initialCourse?.semester as "Ganjil" | "Genap") ?? "Ganjil"
  );
  const [isActiveCourse, setIsActiveCourse] = useState(initialCourse?.is_active ?? true);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    setFormError(null);

    try {
      await onSubmit({
        code: code.trim(),
        name: name.trim(),
        academic_year: academicYear.trim(),
        semester,
        is_active: isActiveCourse,
      });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Couldn't save course. Please try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-apple-modal"
    >
      <h4 id="course-modal-title" className="font-bold text-sm text-slate-900">
        {isEdit ? "Edit Course" : "New Course"}
      </h4>

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
          <label className="block font-semibold text-slate-600 mb-1">
            Course Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            placeholder="IF2101"
            className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 transition-shadow duration-150"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-600 mb-1">Course Title</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Pemrograman Web"
            className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 transition-shadow duration-150"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              required
              placeholder="2025/2026"
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 transition-shadow duration-150"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as "Ganjil" | "Genap")}
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 transition-shadow duration-150"
            >
              <option value="Ganjil">Ganjil (Odd)</option>
              <option value="Genap">Genap (Even)</option>
            </select>
          </div>
        </div>

        {/* Active / Archived Offering Switch (Edit Mode) */}
        {isEdit && (
          <div className="pt-1">
            <label className="block font-semibold text-slate-600 mb-1.5">
              Offering Status
            </label>
            <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActiveCourse ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  <span className="font-bold text-slate-900 text-xs">
                    {isActiveCourse ? "Active Offering" : "Archived"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isActiveCourse
                    ? "Visible and active for the current semester."
                    : "Archived as a read-only historical record."}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isActiveCourse}
                onClick={() => setIsActiveCourse((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                  isActiveCourse ? "bg-slate-900" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isActiveCourse ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-50 apple-press transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 shadow-xs apple-press transition-all cursor-pointer"
        >
          {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Course"}
        </button>
      </div>
    </form>
  );
}

export function CourseModal(props: CourseModalProps) {
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
      aria-labelledby="course-modal-title"
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
    >
      <CourseFormInner
        key={props.initialCourse?.id ?? "create"}
        initialCourse={props.initialCourse}
        onClose={props.onClose}
        onSubmit={props.onSubmit}
        isSubmitting={props.isSubmitting}
      />
    </div>
  );
}
