"use client";

import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  Course,
  CourseStudent,
  Assignment,
  AssignmentSubmission,
} from "@/features/admin/types";
import { useAssignmentSubmissions } from "@/features/admin/hooks/use-admin-course-workspace";
import { adminQueryKeys } from "@/features/admin/constants/admin-query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { useModalFocusTrap } from "@/hooks/use-modal-focus-trap";
import { formatDateTime } from "@/lib/format/date";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { SubmissionGradeForm } from "@/features/assignments/components/submission-grade-form";
import {
  GradePublishBar,
  getPublishErrorMessage,
} from "@/features/assignments/components/grade-publish-bar";
import {
  ArrowLeftIcon,
  ClockIcon,
  PencilSimpleIcon,
  MagnifyingGlassIcon,
  FileTextIcon,
  ChecksIcon,
  EyeIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react";

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
    setGradesPublished,
    isPublishing,
    publishError,
  } = useAssignmentSubmissions(course.id, assignment.id);

  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionFilter, setSubmissionFilter] = useState<"all" | "pending" | "graded">("all");
  const [selectedSubForGrade, setSelectedSubForGrade] = useState<AssignmentSubmission | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const userId = useAuthStore((state) => state.user?.id) ?? "";
  const queryClient = useQueryClient();

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
        sub.file_name.toLowerCase().includes(submissionSearch.toLowerCase()) ||
        Boolean(sub.student_name && sub.student_name.toLowerCase().includes(submissionSearch.toLowerCase()));
      if (!matchesSearch) return false;

      if (submissionFilter === "pending") return sub.score === null;
      if (submissionFilter === "graded") return sub.score !== null;
      return true;
    });
  }, [submissions, submissionSearch, submissionFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Notifications */}
      {actionSuccess && (
        <NotificationBanner
          variant="success"
          message={actionSuccess}
          onClose={() => setActionSuccess(null)}
        />
      )}

      {/* Top Back Action & Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg shadow-xs transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
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
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Assignment Task
              </span>
              {assignment.due_date && (
                <>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="font-medium text-slate-500 flex items-center gap-1">
                    <ClockIcon className="w-3.5 h-3.5" />
                    <span>Due {formatDateTime(assignment.due_date)}</span>
                  </span>
                </>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {assignment.title}
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              {assignment.description || "No instructions provided."}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-900">
                Max Score: {assignment.max_points} pts
              </span>
              <button
                type="button"
                onClick={() => onOpenEditAssignment(assignment)}
                className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1.5 apple-press shadow-xs transition-colors"
                title="Edit Assignment Details"
              >
                <PencilSimpleIcon className="w-3 h-3" />
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

      <GradePublishBar
        published={assignment.grades_published}
        publishedAt={assignment.grades_published_at}
        pendingCount={pendingCount}
        gradedCount={gradedCount}
        isPending={isPublishing}
        errorMessage={publishError ? getPublishErrorMessage(publishError) : null}
        onSetPublished={setGradesPublished}
      />

      {/* Submissions Table & Management Controls */}
      <div className="space-y-4">
        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              aria-label="Search submissions by student or file name"
              placeholder="Search by student or file name..."
              value={submissionSearch}
              onChange={(e) => setSubmissionSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
            />
            <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto bg-white border border-slate-200 rounded-full p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setSubmissionFilter("all")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
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
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
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
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
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
            Loading submissions...
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <FileTextIcon className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">No submissions yet</p>
            <p className="text-[11px]">
              {submissions.length === 0
                ? "No one has turned in this assignment yet."
                : "No submissions match your search or filter."}
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
                    {(sub.student_name || sub.student_username).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-900">
                        {sub.student_name ? `${sub.student_name} (${sub.student_username})` : sub.student_username}
                      </h4>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      {sub.is_late ? (
                        <span className="text-xs font-semibold text-rose-700">
                          Late
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-500">
                          On time
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Turned in: {formatDateTime(sub.submitted_at)} • File:{" "}
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
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ChecksIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {sub.score} / {assignment.max_points} pts
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-700">
                      Ungraded
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
                        className="apple-press px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <a
                        href={sub.download_url}
                        download
                        className="apple-press px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                        title="Download student submission"
                      >
                        <DownloadSimpleIcon className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Download</span>
                      </a>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedSubForGrade(sub)}
                    aria-label={`${sub.score !== null ? "Edit grade for" : "Grade submission from"} ${sub.student_username}`}
                    className="apple-press px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors"
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
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center overflow-y-auto p-4"
        >
          <SubmissionGradeForm
            key={selectedSubForGrade.id}
            userId={userId}
            courseId={course.id}
            assignmentId={assignment.id}
            maxPoints={assignment.max_points || 100}
            submission={selectedSubForGrade}
            titleId="grade-submission-modal-title"
            onCancel={() => setSelectedSubForGrade(null)}
            onSaved={() => {
              setSelectedSubForGrade(null);
              queryClient.invalidateQueries({
                queryKey: adminQueryKeys.assignmentSubmissions(course.id, assignment.id),
              });
              queryClient.invalidateQueries({
                queryKey: adminQueryKeys.courseAssignments(course.id),
              });
              setActionSuccess(
                assignment.grades_published
                  ? "Grade recorded. It's visible to the student."
                  : "Grade recorded. Publish grades when you're ready."
              );
            }}
          />
        </div>
      )}
    </div>
  );
}
