"use client";

import React, { useState, useMemo } from "react";
import {
  AlertCircle,
  GraduationCap,
  Search,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type {
  Course,
  CourseStudent,
  CourseStaff,
  AdminUser,
} from "@/features/admin/types";
import { useModalFocusTrap } from "@/hooks/use-modal-focus-trap";

interface CoursePeopleTabProps {
  course: Course;
  students: CourseStudent[];
  staff: CourseStaff[];
  systemUsers: AdminUser[];
  onEnrollStudents: (usernames: string[]) => Promise<{ message: string }>;
  onAssignStaff: (usernames: string[]) => Promise<{ message: string }>;
  onUnenrollStudent: (studentId: string) => Promise<void>;
  onRemoveStaff: (staffId: string) => Promise<void>;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function CoursePeopleTab({
  course,
  students,
  staff,
  systemUsers,
  onEnrollStudents,
  onAssignStaff,
  onUnenrollStudent,
  onRemoveStaff,
  onSuccess,
  onError,
}: CoursePeopleTabProps) {
  const [peopleSearch, setPeopleSearch] = useState("");
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollType, setEnrollType] = useState<"student" | "staff">("student");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);
  const [enrollModalError, setEnrollModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const enrollModalRef = useModalFocusTrap<HTMLDivElement>({
    isOpen: showEnrollModal,
    onClose: () => {
      setShowEnrollModal(false);
      setEnrollModalError(null);
    },
  });

  // Filter staff and students by search query
  const filteredStaff = useMemo(() => {
    const q = peopleSearch.toLowerCase().trim();
    if (!q) return staff;
    return staff.filter(
      (s) => s.username.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [staff, peopleSearch]);

  const filteredStudents = useMemo(() => {
    const q = peopleSearch.toLowerCase().trim();
    if (!q) return students;
    return students.filter(
      (s) => s.username.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [students, peopleSearch]);

  // Autocomplete suggestions computation (Email "To:" style)
  const userSuggestions = useMemo(() => {
    const query = tagInput.trim().toLowerCase();
    if (!query) return [];

    const targetRole = enrollType === "student" ? "praktikan" : "asprak";
    const existingTagsSet = new Set(tags.map((t) => t.toLowerCase()));
    const enrolledStudentSet = new Set(students.map((s) => s.username.toLowerCase()));
    const enrolledStaffSet = new Set(staff.map((s) => s.username.toLowerCase()));

    return systemUsers
      .filter((u) => {
        if (u.role !== targetRole) return false;
        const uName = u.username.toLowerCase();
        const uEmail = u.email.toLowerCase();
        if (existingTagsSet.has(uName)) return false;
        if (enrollType === "student" && enrolledStudentSet.has(uName)) return false;
        if (enrollType === "staff" && enrolledStaffSet.has(uName)) return false;
        return uName.includes(query) || uEmail.includes(query);
      })
      .slice(0, 6);
  }, [tagInput, enrollType, tags, students, staff, systemUsers]);

  const handleSelectSuggestion = (username: string) => {
    setTags((prev) => {
      const existing = new Set(prev);
      existing.add(username);
      return Array.from(existing);
    });
    setTagInput("");
    setActiveSuggestionIdx(-1);
    setEnrollModalError(null);
  };

  const handleAddTags = (inputStr: string) => {
    const rawItems = inputStr
      .split(/[\n,;\t ]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (rawItems.length === 0) return;

    setTags((prev) => {
      const existing = new Set(prev);
      rawItems.forEach((item) => existing.add(item));
      return Array.from(existing);
    });
    setTagInput("");
    setActiveSuggestionIdx(-1);
    setEnrollModalError(null);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (userSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIdx((prev) =>
          prev < userSuggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIdx((prev) =>
          prev > 0 ? prev - 1 : userSuggestions.length - 1
        );
        return;
      }
      if (
        (e.key === "Enter" || e.key === "Tab") &&
        activeSuggestionIdx >= 0 &&
        activeSuggestionIdx < userSuggestions.length
      ) {
        e.preventDefault();
        handleSelectSuggestion(userSuggestions[activeSuggestionIdx].username);
        return;
      }
      if (e.key === "Escape") {
        setActiveSuggestionIdx(-1);
        return;
      }
    }

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (userSuggestions.length > 0 && activeSuggestionIdx >= 0) {
        handleSelectSuggestion(userSuggestions[activeSuggestionIdx].username);
      } else {
        handleAddTags(tagInput);
      }
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      e.preventDefault();
      setTags((prev) => prev.slice(0, -1));
      setEnrollModalError(null);
    }
  };

  const handleTagPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    handleAddTags(pastedText);
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setEnrollModalError(null);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentTags = [...tags];
    if (tagInput.trim()) {
      const extra = tagInput
        .trim()
        .split(/[\n,;\t ]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      extra.forEach((t) => {
        if (!currentTags.includes(t)) currentTags.push(t);
      });
    }

    if (currentTags.length === 0) {
      setEnrollModalError("Add at least one username or student NPM.");
      return;
    }

    setIsSubmitting(true);
    setEnrollModalError(null);

    try {
      if (enrollType === "student") {
        const res = await onEnrollStudents(currentTags);
        onSuccess(res.message || `Enrolled ${currentTags.length} ${currentTags.length === 1 ? "student" : "students"}.`);
      } else {
        const res = await onAssignStaff(currentTags);
        onSuccess(res.message || `Assigned ${currentTags.length} ${currentTags.length === 1 ? "assistant" : "assistants"}.`);
      }
      setShowEnrollModal(false);
      setTags([]);
      setTagInput("");
      setEnrollModalError(null);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Couldn't complete enrollment. Please try again.";
      setEnrollModalError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnenroll = async (student: CourseStudent) => {
    if (!confirm(`Unenroll ${student.username} from ${course.code}?`)) return;
    try {
      await onUnenrollStudent(student.id);
      onSuccess(`Unenrolled ${student.username}.`);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Couldn't unenroll student. Please try again.");
    }
  };

  const handleRemoveAssistant = async (staffMember: CourseStaff) => {
    if (!confirm(`Remove assistant ${staffMember.username} from ${course.code}?`))
      return;
    try {
      await onRemoveStaff(staffMember.id);
      onSuccess(`Removed ${staffMember.username} from ${course.code}.`);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Couldn't remove assistant. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search by NPM, username, or name..."
            value={peopleSearch}
            onChange={(e) => setPeopleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setEnrollType("staff");
              setTags([]);
              setEnrollModalError(null);
              setTagInput("");
              setShowEnrollModal(true);
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Assign Assistant</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEnrollType("student");
              setTags([]);
              setEnrollModalError(null);
              setTagInput("");
              setShowEnrollModal(true);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-full shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Enroll Students</span>
          </button>
        </div>
      </div>

      {/* Teaching Assistants Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>Teaching Assistants ({filteredStaff.length})</span>
          </h3>
        </div>
        {filteredStaff.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">No assistants found matching your search.</p>
        ) : (
          <div className="divide-y divide-slate-100 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredStaff.map((s) => (
              <div
                key={s.id}
                className="p-3.5 sm:p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                    {s.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{s.username}</span>
                    <span className="text-slate-400 text-[11px]">{s.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 font-semibold text-[10px] rounded-full border border-slate-200">
                    Asprak
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAssistant(s)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition-colors"
                    title="Remove assistant from course"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enrolled Students Section */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4" />
            <span>Enrolled Students ({filteredStudents.length})</span>
          </h3>
        </div>
        {filteredStudents.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            No enrolled students found matching your search.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 bg-white rounded-3xl border border-slate-200 max-h-96 overflow-y-auto shadow-xs">
            {filteredStudents.map((st) => (
              <div
                key={st.id}
                className="p-3.5 sm:p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {st.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{st.username}</span>
                    <span className="text-slate-400 text-[11px]">{st.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px] font-mono">Enrolled</span>
                  <button
                    type="button"
                    onClick={() => handleUnenroll(st)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition-colors flex items-center gap-1"
                    title="Unenroll student"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    <span className="text-[10px] hidden sm:inline">Unenroll</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tag-Chip Multi-Input Enrollment Modal */}
      {showEnrollModal && (
        <div
          ref={enrollModalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="enroll-modal-title"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleEnrollSubmit}
            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 id="enroll-modal-title" className="font-bold text-sm text-slate-900">
                  {enrollType === "student"
                    ? "Enroll Students"
                    : "Assign Teaching Assistants"}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Course: {course.code} - {course.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEnrollModal(false);
                  setEnrollModalError(null);
                }}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* In-Modal Error Banner */}
            {enrollModalError && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block text-rose-900">Enrollment Notice</span>
                  <span className="text-rose-700 leading-relaxed">{enrollModalError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnrollModalError(null)}
                  className="text-rose-400 hover:text-rose-700 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="space-y-2 relative">
              <label className="block text-xs font-semibold text-slate-700">
                {enrollType === "student"
                  ? "Student NPM or username"
                  : "Assistant username or email"}
              </label>

              {/* Tag Chip Container with Embedded Input */}
              <div className="p-2.5 border border-slate-200 rounded-2xl bg-slate-50/50 min-h-[90px] max-h-48 overflow-y-auto flex flex-wrap gap-1.5 items-start focus-within:ring-2 focus-within:ring-slate-900 focus-within:bg-white transition-all">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white shadow-xs animate-in fade-in zoom-in-95 duration-100"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setActiveSuggestionIdx(0);
                    if (enrollModalError) setEnrollModalError(null);
                  }}
                  onKeyDown={handleTagKeyDown}
                  onPaste={handleTagPaste}
                  placeholder={
                    tags.length === 0
                      ? enrollType === "student"
                        ? "Type NPM or username and pick from list..."
                        : "Type username or email and pick from list..."
                      : "Add more..."
                  }
                  className="flex-1 min-w-[160px] text-xs bg-transparent border-none outline-none p-1 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Email-like Autocomplete Suggestions Dropdown */}
              {userSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100 max-h-56 overflow-y-auto">
                  <div className="px-3.5 py-1.5 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>
                      Matching {enrollType === "student" ? "Students" : "Teaching Staff"}
                    </span>
                    <span>Use ↑↓ and Enter</span>
                  </div>
                  {userSuggestions.map((userItem, idx) => {
                    const isSelected = activeSuggestionIdx === idx;
                    return (
                      <button
                        key={userItem.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(userItem.username)}
                        onMouseEnter={() => setActiveSuggestionIdx(idx)}
                        className={`w-full text-left p-3 flex items-center justify-between gap-3 text-xs transition-colors ${
                          isSelected ? "bg-slate-100" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {userItem.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <span className="font-bold text-slate-900 block truncate">
                              {userItem.username}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {userItem.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-800">
                            {userItem.role}
                          </span>
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="text-[11px] text-slate-400 pt-1">
                Tip: Type an NPM or email to search, or paste multiple usernames separated by commas.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowEnrollModal(false);
                  setEnrollModalError(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (tags.length === 0 && !tagInput.trim())}
                className="px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Saving..." : enrollType === "student" ? "Enroll Students" : "Assign Assistants"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

