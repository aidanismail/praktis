"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Clock3,
  Pencil,
  Search,
  FileText,
  CheckCheck,
  Eye,
  Download,
  AlertCircle,
  X,
} from "lucide-react";
import type {
  Course,
  CourseStudent,
  Assignment,
  AssignmentSubmission,
} from "@/features/admin/types";
import { useAssignmentSubmissions } from "@/features/admin/hooks/use-admin-course-workspace";
import { useModalFocusTrap } from "@/hooks/use-modal-focus-trap";

interface CourseSubmissionsViewProps {
  course: Course;
  assignment: Assignment;
  students: CourseStudent[];
  onBack: () => void;
  onOpenEditAssignment: (assignment: Assignment) => void;
  onPreviewDoc: (doc: {
    title: string;
    fileUrl: string;
    fileExtension: string;
    courseCode: string;
  }) => void;
}

export function CourseSubmissionsView({
  course,
  assignment,
  students,
  onBack,
  onOpenEditAssignment,
  onPreviewDoc,
}: CourseSubmissionsViewProps) {
  const {
    submissions,
    isLoadingSubmissions,
    gradeSubmission,
    isGrading,
  } = useAssignmentSubmissions(course.id, assignment.id);

  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionFilter, setSubmissionFilter] = useState<"all" | "pending" | "graded">("all");
  const [selectedSubForGrade, setSelectedSubForGrade] = useState<AssignmentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(assignment.max_points || 100);
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gradeModalRef = useModalFocusTrap<HTMLDivElement>({
    isOpen: Boolean(selectedSubForGrade),
    onClose: () => setSelectedSubForGrade(null),
  });

  const pendingCount = useMemo(
    () => submissions.filter((s) => s.score === null).length,
    [submissions]
  );
  const gradedCount = useMemo(
    () => submissions.filter((s) => s.score !== null).length,
    [submissions]
  );

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesSearch =
        sub.student_username.toLowerCase().includes(submissionSearch.toLowerCase()) ||
        sub.file_name.toLowerCase().includes(submissionSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (submissionFilter === "pending") return sub.score === null;
      if (submissionFilter === "graded") return sub.score !== null;
      return true;
    });
  }, [submissions, submissionSearch, submissionFilter]);

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForGrade) return;

    setError(null);
    try {
      await gradeSubmission({
        submissionId: selectedSubForGrade.id,
        score: Number(gradeScore),
        feedback: gradeFeedback.trim() || undefined,
      });
      setSelectedSubForGrade(null);
      setActionSuccess("Submission graded successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to grade submission.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Notifications */}
      {actionSuccess && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-xs font-medium text-white flex items-center justify-between shadow-xs">
          <span>{actionSuccess}</span>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-600 hover:text-rose-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Back Action & Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-full shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Classwork</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Course: {course.code}
          </span>
        </div>
      </div>

      {/* Assignment Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white uppercase">
                Assignment Task
              </span>
              {assignment.due_date && (
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Clock3 className="w-3.5 h-3.5" />
                  <span>Due {new Date(assignment.due_date).toLocaleString()}</span>
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {assignment.title}
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              {assignment.description || "No specific instructions provided."}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                Max Score: {assignment.max_points} pts
              </span>
              <button
                type="button"
                onClick={() => onOpenEditAssignment(assignment)}
                className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-full flex items-center gap-1.5 apple-press shadow-xs transition-colors"
                title="Edit Assignment Details"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit Task</span>
              </button>
            </div>
            {assignment.allowed_file_types && (
              <span className="text-[11px] text-slate-400 font-mono">
                Accepts: {assignment.allowed_file_types}
              </span>
            )}
          </div>
        </div>

        {/* 4 Stat Overview Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Students
            </span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">
              {students.length}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Turned In
            </span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">
              {submissions.length}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Graded
            </span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">
              {gradedCount}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Needs Grading
            </span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">
              {pendingCount}
            </span>
          </div>
        </div>
      </div>

      {/* Submissions Table & Management Controls */}
      <div className="space-y-4">
        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search student username or file name..."
              value={submissionSearch}
              onChange={(e) => setSubmissionSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto bg-white border border-slate-200 rounded-full p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setSubmissionFilter("all")}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                submissionFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({submissions.length})
            </button>
            <button
              type="button"
              onClick={() => setSubmissionFilter("pending")}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                submissionFilter === "pending"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Needs Grading ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setSubmissionFilter("graded")}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                submissionFilter === "graded"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Graded ({gradedCount})
            </button>
          </div>
        </div>

        {/* Submissions Roster */}
        {isLoadingSubmissions ? (
          <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-xs">
            Loading submitted coursework...
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">No submissions found</p>
            <p className="text-[11px]">
              {submissions.length === 0
                ? "No student has turned in this assignment yet."
                : "No submissions match the current filter criteria."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {sub.student_username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-900">{sub.student_username}</h4>
                      {sub.is_late ? (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Late Submission
                        </span>
                      ) : (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          On Time
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Turned in: {new Date(sub.submitted_at).toLocaleString()} • File:{" "}
                      <span className="font-mono text-slate-700">{sub.file_name}</span>
                    </p>
                    {sub.feedback && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 mt-2">
                        <span className="font-semibold text-slate-700">Feedback: </span>
                        {sub.feedback}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {sub.score !== null ? (
                    <span className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-900 font-bold rounded-full text-xs flex items-center gap-1.5">
                      <CheckCheck className="w-3.5 h-3.5 text-slate-700" />
                      <span>
                        {sub.score} / {assignment.max_points} pts
                      </span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 font-semibold rounded-full text-[11px]">
                      Not Graded
                    </span>
                  )}

                  {sub.download_url && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          onPreviewDoc({
                            title: `${sub.student_username} - ${sub.file_name}`,
                            fileUrl: sub.download_url!,
                            fileExtension: sub.file_name.split(".").pop() || "pdf",
                            courseCode: course.code,
                          })
                        }
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <a
                        href={sub.download_url}
                        download
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-full text-xs flex items-center gap-1.5 transition-colors"
                        title="Download student submission"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Download</span>
                      </a>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubForGrade(sub);
                      setGradeScore(sub.score ?? assignment.max_points ?? 100);
                      setGradeFeedback(sub.feedback || "");
                    }}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full text-xs shadow-xs transition-colors"
                  >
                    {sub.score !== null ? "Edit Grade" : "Grade"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grading Modal */}
      {selectedSubForGrade && (
        <div
          ref={gradeModalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="grade-submission-modal-title"
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleGradeSubmit}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <h4 id="grade-submission-modal-title" className="font-bold text-sm text-slate-900">
              Grade Submission: {selectedSubForGrade.student_username}
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Score (0 - {assignment.max_points || 100})
                </label>
                <input
                  type="number"
                  min="0"
                  max={assignment.max_points || 100}
                  value={gradeScore}
                  onChange={(e) => setGradeScore(Number(e.target.value))}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Feedback (Optional)</label>
                <textarea
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 resize-none"
                  placeholder="Feedback notes..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSubForGrade(null)}
                className="px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGrading}
                className="px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 shadow-xs"
              >
                {isGrading ? "Saving..." : "Save Grade"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

