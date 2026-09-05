"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Trash2, X } from "lucide-react";
import type {
  Course,
  Assignment,
  AnnouncementItem,
} from "@/features/admin/types";
import {
  loadSavedCourseTheme,
  type SavedCourseTheme,
} from "@/features/courses/constants/banner-themes";
import { CourseBannerCustomizerModal } from "@/features/courses/components/course-banner-customizer-modal";
import { DocumentPreviewModal } from "@/components/ui/document-preview-modal";

import { useAdminCourses } from "../hooks/use-admin-courses";
import { useCourseWorkspace } from "../hooks/use-admin-course-workspace";

import { CourseListView } from "./course-management/course-list-view";
import { CourseWorkspaceHeader } from "./course-management/course-workspace-header";
import { CourseStreamTab } from "./course-management/course-stream-tab";
import { CourseClassworkTab } from "./course-management/course-classwork-tab";
import { CoursePeopleTab } from "./course-management/course-people-tab";
import { CourseSessionsTab } from "./course-management/course-sessions-tab";
import { CourseSubmissionsView } from "./course-management/course-submissions-view";
import { CourseModal } from "./course-management/course-modal";
import { CourseAssignmentModal } from "./course-management/course-assignment-modal";

export function CourseManagement() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Declarative URL search parameters
  const courseId = searchParams.get("courseId");
  const workspaceTab =
    (searchParams.get("workspaceTab") as
      | "stream"
      | "classwork"
      | "people"
      | "sessions") || "stream";
  const assignmentId = searchParams.get("assignmentId");

  // Courses query and mutations
  const {
    courses,
    isLoading: isLoadingCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    isCreating,
    isUpdating,
  } = useAdminCourses();

  // Selected course derived from URL
  const selectedCourse = useMemo(
    () => (courseId ? courses.find((c) => c.id === courseId) ?? null : null),
    [courses, courseId]
  );

  // Active course workspace query and mutations
  const {
    students,
    staff,
    sessions,
    courseModules,
    announcements,
    assignments,
    systemUsers,
    enrollStudents,
    assignStaff,
    unenrollStudent,
    removeStaff,
    createSession,
    deleteModule,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    addComment,
    deleteComment,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    invalidateModules,
  } = useCourseWorkspace(selectedCourse?.id ?? null);

  // Selected assignment for submissions view
  const selectedAssignment = useMemo(
    () =>
      assignmentId
        ? assignments.find((a) => a.id === assignmentId) ?? null
        : null,
    [assignments, assignmentId]
  );

  // Modal & form states
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const [showCreateAssignmentModal, setShowCreateAssignmentModal] =
    useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null
  );

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [themeModalCourse, setThemeModalCourse] = useState<Course | null>(null);

  // Document preview modal state
  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean;
    title: string;
    fileUrl: string | null;
    fileExtension: string;
    courseCode: string;
  }>({
    isOpen: false,
    title: "",
    fileUrl: null,
    fileExtension: "pdf",
    courseCode: "",
  });

  // Action toasts
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (actionSuccess) {
      const t = setTimeout(() => setActionSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [actionSuccess]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // Banner themes state
  const [themeOverrides, setThemeOverrides] = useState<
    Record<string, SavedCourseTheme>
  >({});

  const courseThemes = useMemo(() => {
    const themes: Record<string, SavedCourseTheme> = {};
    courses.forEach((c) => {
      themes[c.id] =
        themeOverrides[c.id] || loadSavedCourseTheme(c.id, c.code);
    });
    return themes;
  }, [courses, themeOverrides]);

  const handleThemeUpdate = useCallback((e: Event) => {
    const custom = e as CustomEvent<SavedCourseTheme & { courseId: string }>;
    if (custom.detail?.courseId) {
      setThemeOverrides((prev) => ({
        ...prev,
        [custom.detail.courseId]: {
          themeId: custom.detail.themeId,
          patternId: custom.detail.patternId,
          imageUrl: custom.detail.imageUrl,
        },
      }));
    }
  }, []);

  useEffect(() => {
    window.addEventListener("course-theme-updated", handleThemeUpdate);
    return () =>
      window.removeEventListener("course-theme-updated", handleThemeUpdate);
  }, [handleThemeUpdate]);

  // Navigation handlers using Next.js App Router search params
  const handleOpenWorkspace = useCallback(
    (course: Course) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "courses");
      params.set("courseId", course.id);
      params.set("workspaceTab", "stream");
      params.delete("assignmentId");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleBackToCourses = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("courseId");
    params.delete("workspaceTab");
    params.delete("assignmentId");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleSelectWorkspaceTab = useCallback(
    (tab: "stream" | "classwork" | "people" | "sessions") => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("workspaceTab", tab);
      params.delete("assignmentId");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleOpenSubmissions = useCallback(
    (assignment: Assignment) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("workspaceTab", "classwork");
      params.set("assignmentId", assignment.id);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleBackToClasswork = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("assignmentId");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  // Document preview handlers
  const handlePreviewDoc = useCallback(
    (doc: {
      title: string;
      fileUrl: string;
      fileExtension: string;
      courseCode: string;
    }) => {
      setPreviewDoc({
        isOpen: true,
        title: doc.title,
        fileUrl: doc.fileUrl,
        fileExtension: doc.fileExtension,
        courseCode: doc.courseCode,
      });
    },
    []
  );

  const handleClosePreviewDoc = useCallback(() => {
    setPreviewDoc((prev) => ({ ...prev, isOpen: false, fileUrl: null }));
  }, []);

  // Course CRUD handlers
  const handleCourseSubmit = async (data: {
    code: string;
    name: string;
    academic_year: string;
    semester: "Ganjil" | "Genap";
    is_active?: boolean;
  }) => {
    try {
      if (editingCourse) {
        await updateCourse({ id: editingCourse.id, payload: data });
        setActionSuccess(`Course ${data.code} updated successfully.`);
      } else {
        await createCourse(data);
        setActionSuccess(`Course ${data.code} created successfully.`);
      }
      setShowCreateCourseModal(false);
      setEditingCourse(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save course.");
    }
  };

  const handleDeleteCourseConfirmed = async () => {
    if (!courseToDelete) return;
    try {
      await deleteCourse(courseToDelete.id);
      setActionSuccess(`Course ${courseToDelete.code} deleted successfully.`);
      setCourseToDelete(null);
      if (selectedCourse?.id === courseToDelete.id) {
        handleBackToCourses();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete course.");
    }
  };

  // Assignment CRUD handlers
  const handleAssignmentSubmit = async (data: {
    title: string;
    description: string;
    max_points: number;
    allowed_file_types: string;
    due_date?: string | null;
  }) => {
    try {
      if (editingAssignment) {
        await updateAssignment({
          assignmentId: editingAssignment.id,
          data: {
            ...data,
            due_date: data.due_date || null,
            is_published: true,
          },
        });
        setActionSuccess(`Assignment "${data.title}" updated successfully.`);
      } else {
        await createAssignment({
          ...data,
          due_date: data.due_date || null,
          is_published: true,
        });
        setActionSuccess(`Assignment "${data.title}" created successfully.`);
      }
      setShowCreateAssignmentModal(false);
      setEditingAssignment(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save assignment."
      );
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await deleteAssignment(assignmentId);
      setActionSuccess("Assignment deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete assignment."
      );
    }
  };

  // Announcement stream handlers
  const handleCreateAnnouncement = async (data: {
    title: string;
    content: string;
    is_pinned?: boolean;
  }) => {
    try {
      await createAnnouncement(data);
      setActionSuccess("Announcement published.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to publish announcement."
      );
    }
  };

  const handleTogglePinAnnouncement = async (ann: AnnouncementItem) => {
    try {
      await updateAnnouncement({
        announcementId: ann.id,
        data: { is_pinned: !ann.is_pinned },
      });
      setActionSuccess(
        ann.is_pinned ? "Announcement unpinned." : "Announcement pinned."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update pin.");
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      await deleteAnnouncement(announcementId);
      setActionSuccess("Announcement deleted.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete announcement."
      );
    }
  };

  const handleAddComment = async (announcementId: string, content: string) => {
    try {
      await addComment({ announcementId, content });
      setActionSuccess("Comment added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment.");
    }
  };

  const handleDeleteComment = async (
    announcementId: string,
    commentId: string
  ) => {
    try {
      await deleteComment({ announcementId, commentId });
      setActionSuccess("Comment deleted.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete comment."
      );
    }
  };

  // Sessions & Attendance handlers
  const handleCreateSession = async (data: { title: string; date: string }) => {
    try {
      await createSession(data);
      setActionSuccess(`Session "${data.title}" created.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create session."
      );
    }
  };

  // Modules handlers
  const handleDeleteModule = async (moduleId: string) => {
    try {
      await deleteModule(moduleId);
      setActionSuccess("Module removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete module.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Feedback */}
      <div aria-live="polite" aria-atomic="true">
        {actionSuccess && (
          <div
            role="status"
            className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold shadow-xs animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
            <button
              type="button"
              onClick={() => setActionSuccess(null)}
              className="ml-auto text-emerald-600 hover:text-emerald-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold shadow-xs animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto text-rose-600 hover:text-rose-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content: Course Catalog vs. Course Workspace */}
      {!selectedCourse ? (
        <CourseListView
          courses={courses}
          isLoading={isLoadingCourses}
          courseThemes={courseThemes}
          onOpenWorkspace={handleOpenWorkspace}
          onCreateCourse={() => setShowCreateCourseModal(true)}
          onEditCourse={(course) => setEditingCourse(course)}
          onDeleteCourse={(course) => setCourseToDelete(course)}
          onCustomizeBanner={(course) => {
            setThemeModalCourse(course);
            setShowThemeModal(true);
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Workspace Banner Header */}
          <CourseWorkspaceHeader
            course={selectedCourse}
            theme={
              courseThemes[selectedCourse.id] ||
              loadSavedCourseTheme(selectedCourse.id, selectedCourse.code)
            }
            enrolledCount={students.length}
            staffCount={staff.length}
            onBack={handleBackToCourses}
            onCustomizeBanner={() => {
              setThemeModalCourse(selectedCourse);
              setShowThemeModal(true);
            }}
            onEditCourse={() => setEditingCourse(selectedCourse)}
          />

          {/* Submissions View vs. Workspace Tabs */}
          {assignmentId && selectedAssignment ? (
            <CourseSubmissionsView
              course={selectedCourse}
              assignment={selectedAssignment}
              students={students}
              onBack={handleBackToClasswork}
              onOpenEditAssignment={(assignment) =>
                setEditingAssignment(assignment)
              }
              onPreviewDoc={handlePreviewDoc}
            />
          ) : (
            <>
              {workspaceTab === "stream" && (
                <CourseStreamTab
                  course={selectedCourse}
                  announcements={announcements}
                  assignments={assignments}
                  sessions={sessions}
                  onOpenSubmissions={handleOpenSubmissions}
                  onNavigateToClasswork={() =>
                    handleSelectWorkspaceTab("classwork")
                  }
                  onNavigateToSessions={() =>
                    handleSelectWorkspaceTab("sessions")
                  }
                  onCreateAnnouncement={handleCreateAnnouncement}
                  onTogglePin={handleTogglePinAnnouncement}
                  onDeleteAnnouncement={handleDeleteAnnouncement}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                />
              )}

              {workspaceTab === "classwork" && (
                <CourseClassworkTab
                  course={selectedCourse}
                  assignments={assignments}
                  modules={courseModules}
                  onOpenSubmissions={handleOpenSubmissions}
                  onOpenCreateAssignment={() =>
                    setShowCreateAssignmentModal(true)
                  }
                  onOpenEditAssignment={(assignment) =>
                    setEditingAssignment(assignment)
                  }
                  onDeleteAssignment={handleDeleteAssignment}
                  onDeleteModule={handleDeleteModule}
                  onUploadModulesSuccess={invalidateModules}
                  onPreviewDoc={handlePreviewDoc}
                  onError={setError}
                  onSuccess={setActionSuccess}
                />
              )}

              {workspaceTab === "people" && (
                <CoursePeopleTab
                  course={selectedCourse}
                  students={students}
                  staff={staff}
                  systemUsers={systemUsers}
                  onEnrollStudents={enrollStudents}
                  onAssignStaff={assignStaff}
                  onUnenrollStudent={unenrollStudent}
                  onRemoveStaff={removeStaff}
                  onSuccess={setActionSuccess}
                  onError={setError}
                />
              )}

              {workspaceTab === "sessions" && (
                <CourseSessionsTab
                  course={selectedCourse}
                  sessions={sessions}
                  students={students}
                  onCreateSession={handleCreateSession}
                  onSuccess={setActionSuccess}
                  onError={setError}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Create / Edit Course Modal */}
      <CourseModal
        isOpen={showCreateCourseModal || !!editingCourse}
        initialCourse={editingCourse}
        onClose={() => {
          setShowCreateCourseModal(false);
          setEditingCourse(null);
        }}
        onSubmit={handleCourseSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      {/* Delete Course Confirmation Modal */}
      {courseToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-full bg-rose-50">
                <Trash2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">
                Delete Course
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900">{courseToDelete.code}</strong>{" "}
              ({courseToDelete.name})? This action will permanently remove all
              modules, sessions, announcements, and student enrollments.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCourseConfirmed}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Assignment Modal */}
      <CourseAssignmentModal
        isOpen={showCreateAssignmentModal || !!editingAssignment}
        courseCode={selectedCourse?.code ?? ""}
        editingAssignment={editingAssignment}
        onClose={() => {
          setShowCreateAssignmentModal(false);
          setEditingAssignment(null);
        }}
        onSubmit={handleAssignmentSubmit}
      />

      {/* Banner Customizer Modal */}
      {themeModalCourse && (
        <CourseBannerCustomizerModal
          isOpen={showThemeModal}
          course={themeModalCourse}
          onClose={() => {
            setShowThemeModal(false);
            setThemeModalCourse(null);
          }}
          onSaved={(savedTheme) => {
            setThemeOverrides((prev) => ({
              ...prev,
              [themeModalCourse.id]: savedTheme,
            }));
            setShowThemeModal(false);
            setThemeModalCourse(null);
          }}
        />
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewDoc.isOpen}
        title={previewDoc.title}
        courseCode={previewDoc.courseCode}
        fileUrl={previewDoc.fileUrl}
        fileExtension={previewDoc.fileExtension}
        onClose={handleClosePreviewDoc}
      />
    </div>
  );
}
