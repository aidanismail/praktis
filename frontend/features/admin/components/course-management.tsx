"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Pin,
  PinOff,
  Lock,
  Unlock,
  X,
  UserPlus,
  Download,
  MessageSquare,
  Send,
  Calendar,
  Award,
  ChevronRight,
  GraduationCap,
  Users,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserMinus,
  UploadCloud,
  FileCheck,
  CalendarCheck,
  UserCheck,
  Eye,
  ArrowLeft,
  CheckCheck,
  Clock3,
  Palette,
} from "lucide-react";
import {
  fetchAdminCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  fetchAdminUsers,
  fetchCourseStudents,
  fetchCourseStaff,
  fetchCourseSessions,
  createCourseSession,
  fetchAdminModules,
  createAndUploadModule,
  createAndUploadMultipleModules,
  enrollCourseStudents,
  assignCourseStaff,
  unenrollCourseStudent,
  removeCourseStaff,
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  addAnnouncementComment,
  deleteAnnouncementComment,
  fetchAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  fetchAssignmentSubmissions,
  gradeAssignmentSubmission,
  openSessionAttendance,
  closeSessionAttendance,
  updateSessionAttendance,
  fetchSessionAttendance,
  getAttendanceExportUrl,
} from "../api/admin.api";
import type { Course } from "@/features/courses/types/course.type";
import type { User } from "@/types/user.type";
import type {
  StudentItem,
  StaffItem,
  ClassSessionItem,
  AdminModuleItem,
  AnnouncementItem,
  AssignmentItem,
  SubmissionItem,
  AttendanceItem,
} from "../api/admin.api";
import { DocumentPreviewModal } from "@/components/ui/document-preview-modal";
import {
  getThemeConfig,
  getPatternConfig,
  getDeterministicThemeId,
  loadSavedCourseTheme,
  type SavedCourseTheme,
} from "@/features/courses/constants/banner-themes";
import { CourseBannerCustomizerModal } from "@/features/courses/components/course-banner-customizer-modal";

export function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Banner theme customizer state
  const [courseThemes, setCourseThemes] = useState<Record<string, SavedCourseTheme>>({});
  const [showCustomizeBannerModal, setShowCustomizeBannerModal] = useState(false);
  const [bannerCustomTargetCourse, setBannerCustomTargetCourse] = useState<Course | null>(null);

  // In-browser Document Preview state
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    fileUrl: string;
    fileExtension: string;
    courseCode?: string;
  } | null>(null);

  // Course form fields
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [academicYear, setAcademicYear] = useState("2025/2026");
  const [semester, setSemester] = useState<"Ganjil" | "Genap">("Ganjil");
  const [isActiveCourse, setIsActiveCourse] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Workspace Data (4 Tabs)
  const [activeTab, setActiveTab] = useState<"stream" | "classwork" | "people" | "sessions">("stream");
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [sessions, setSessions] = useState<ClassSessionItem[]>([]);
  const [courseModules, setCourseModules] = useState<AdminModuleItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);

  // System users cache for auto-suggest
  const [systemUsers, setSystemUsers] = useState<User[]>([]);

  // Announcement composer
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnContent, setNewAnnContent] = useState("");
  const [newAnnPinned, setNewAnnPinned] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Module upload in workspace
  const [showUploadModuleModal, setShowUploadModuleModal] = useState(false);
  const [modUploadQueue, setModUploadQueue] = useState<
    Array<{ file: File; title: string; description: string }>
  >([]);
  const [isDraggingMod, setIsDraggingMod] = useState(false);
  const [modUploadProgress, setModUploadProgress] = useState<{
    current: number;
    total: number;
    currentFileName: string;
  } | null>(null);
  const [isUploadingMod, setIsUploadingMod] = useState(false);

  // Assignment composer & editor
  const [showCreateAssignModal, setShowCreateAssignModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignMaxPoints, setAssignMaxPoints] = useState(100);
  const [assignAllowedTypes, setAssignAllowedTypes] = useState("pdf,zip");

  // In-Page Submissions Workspace state (Path/Breadcrumbs system)
  const [activeAssignmentForSubs, setActiveAssignmentForSubs] = useState<AssignmentItem | null>(null);
  const [submissionsList, setSubmissionsList] = useState<SubmissionItem[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionFilter, setSubmissionFilter] = useState<"all" | "graded" | "pending">("all");
  const [selectedSubForGrade, setSelectedSubForGrade] = useState<SubmissionItem | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(100);
  const [gradeFeedback, setGradeFeedback] = useState("");

  // Intuitive Tag-Chip Enrollment state & In-Modal Error + Auto-Suggest
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollType, setEnrollType] = useState<"student" | "staff">("student");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [peopleSearch, setPeopleSearch] = useState("");
  const [enrollModalError, setEnrollModalError] = useState<string | null>(null);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number>(-1);

  // Session create modal & Attendance inspection
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState<ClassSessionItem | null>(null);
  const [sessionAttendanceList, setSessionAttendanceList] = useState<AttendanceItem[]>([]);
  const [isLoadingSessionAttendance, setIsLoadingSessionAttendance] = useState(false);
  const [updatingStudentAttendanceId, setUpdatingStudentAttendanceId] = useState<string | null>(null);

  // Auto-dismiss notification banners
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadCourses = async () => {
    try {
      const data = await fetchAdminCourses();
      setCourses(data);
      const themeMap: Record<string, { themeId: string; patternId: string }> = {};
      data.forEach((c) => {
        themeMap[c.id] = loadSavedCourseTheme(c.id, c.code);
      });
      setCourseThemes(themeMap);
      return data;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkspaceData = useCallback(async (courseId: string, initialAssignmentId?: string | null) => {
    setIsLoadingWorkspace(true);
    try {
      const [stuData, staffData, sessData, allMods, annData, assignData, uList] = await Promise.all([
        fetchCourseStudents(courseId).catch(() => []),
        fetchCourseStaff(courseId).catch(() => []),
        fetchCourseSessions(courseId).catch(() => []),
        fetchAdminModules().catch(() => []),
        fetchAnnouncements(courseId).catch(() => []),
        fetchAssignments(courseId).catch(() => []),
        fetchAdminUsers().catch(() => []),
      ]);
      setStudents(stuData);
      setStaff(staffData);
      setSessions(sessData);
      setCourseModules(allMods.filter((m) => m.course_id === courseId));
      setAnnouncements(annData);
      setAssignments(assignData);
      if (uList && uList.length > 0) {
        setSystemUsers(uList);
      }

      // Check if assignmentId was requested
      if (initialAssignmentId && assignData.length > 0) {
        const targetAssign = assignData.find((a: AssignmentItem) => a.id === initialAssignmentId);
        if (targetAssign) {
          setActiveAssignmentForSubs(targetAssign);
          const subs = await fetchAssignmentSubmissions(courseId, targetAssign.id).catch(() => []);
          setSubmissionsList(subs);
        }
      }
    } catch {
      // Handled quietly
    } finally {
      setIsLoadingWorkspace(false);
    }
  }, []);

  const handleOpenWorkspace = useCallback(async (course: Course, initialAssignmentId?: string | null) => {
    setSelectedCourse(course);
    setActiveTab("classwork");
    setSelectedSessionForAttendance(null);

    // Sync with top bar header
    window.dispatchEvent(
      new CustomEvent("course-workspace-change", {
        detail: { course, tab: "classwork", assignmentTitle: null },
      })
    );

    // Update browser URL
    const params = new URLSearchParams(window.location.search);
    params.set("tab", "courses");
    params.set("courseId", course.id);
    if (!initialAssignmentId) {
      params.delete("assignmentId");
    }
    window.history.pushState({}, "", `?${params.toString()}`);

    await loadWorkspaceData(course.id, initialAssignmentId);
  }, [loadWorkspaceData]);

  const handleCloseWorkspace = useCallback(() => {
    setSelectedCourse(null);
    setActiveAssignmentForSubs(null);
    setSelectedSessionForAttendance(null);

    // Sync with top bar header
    window.dispatchEvent(
      new CustomEvent("course-workspace-change", {
        detail: { course: null, tab: "stream", assignmentTitle: null },
      })
    );

    // Update browser URL
    const params = new URLSearchParams(window.location.search);
    params.delete("courseId");
    params.delete("assignmentId");
    window.history.pushState({}, "", `?${params.toString()}`);
  }, []);

  // Submissions Workspace navigation handlers (Path system)
  const handleOpenSubmissions = async (assign: AssignmentItem) => {
    if (!selectedCourse) return;
    setActiveAssignmentForSubs(assign);
    setIsLoadingSubmissions(true);

    // Sync with top bar header breadcrumb
    window.dispatchEvent(
      new CustomEvent("course-workspace-change", {
        detail: {
          course: selectedCourse,
          tab: "classwork",
          assignmentTitle: `${assign.title} Submissions`,
        },
      })
    );

    // Update browser URL with assignmentId
    const params = new URLSearchParams(window.location.search);
    params.set("tab", "courses");
    params.set("courseId", selectedCourse.id);
    params.set("assignmentId", assign.id);
    window.history.pushState({}, "", `?${params.toString()}`);

    try {
      const subs = await fetchAssignmentSubmissions(selectedCourse.id, assign.id);
      setSubmissionsList(subs);
    } catch {
      setSubmissionsList([]);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const handleBackToClasswork = useCallback(() => {
    if (!selectedCourse) return;
    setActiveAssignmentForSubs(null);
    setSelectedSubForGrade(null);

    // Sync with top bar header breadcrumb
    window.dispatchEvent(
      new CustomEvent("course-workspace-change", {
        detail: {
          course: selectedCourse,
          tab: "classwork",
          assignmentTitle: null,
        },
      })
    );

    // Remove assignmentId from URL
    const params = new URLSearchParams(window.location.search);
    params.delete("assignmentId");
    window.history.pushState({}, "", `?${params.toString()}`);
  }, [selectedCourse]);

  // Listen to breadcrumb back action from header
  useEffect(() => {
    const handleSubsBack = () => {
      handleBackToClasswork();
    };
    window.addEventListener("assignment-submissions-back", handleSubsBack);
    return () => window.removeEventListener("assignment-submissions-back", handleSubsBack);
  }, [handleBackToClasswork]);

  // Listen to top header tab selection & back actions
  useEffect(() => {
    const handleTopTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab: "stream" | "classwork" | "people" | "sessions" }>;
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab);
        if (activeAssignmentForSubs) {
          handleBackToClasswork();
        }
      }
    };

    const handleTopBack = () => {
      handleCloseWorkspace();
    };

    window.addEventListener("course-tab-change", handleTopTabChange);
    window.addEventListener("course-workspace-back", handleTopBack);
    return () => {
      window.removeEventListener("course-tab-change", handleTopTabChange);
      window.removeEventListener("course-workspace-back", handleTopBack);
    };
  }, [handleCloseWorkspace, handleBackToClasswork, activeAssignmentForSubs]);

  // Initial load and URL param check
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [data, uList] = await Promise.all([
          fetchAdminCourses(),
          fetchAdminUsers().catch(() => []),
        ]);
        if (!isMounted) return;
        setCourses(data);
        const themeMap: Record<string, { themeId: string; patternId: string }> = {};
        data.forEach((c) => {
          themeMap[c.id] = loadSavedCourseTheme(c.id, c.code);
        });
        setCourseThemes(themeMap);

        if (uList && uList.length > 0) {
          setSystemUsers(uList);
        }

        // Check if courseId and assignmentId are present in URL
        const params = new URLSearchParams(window.location.search);
        const courseId = params.get("courseId");
        const assignmentId = params.get("assignmentId");

        if (courseId && data.length > 0) {
          const matched = data.find((c) => c.id === courseId);
          if (matched) {
            setSelectedCourse(matched);
            window.dispatchEvent(
              new CustomEvent("course-workspace-change", {
                detail: { course: matched, tab: "classwork", assignmentTitle: null },
              })
            );
            loadWorkspaceData(matched.id, assignmentId);
          }
        }
      } catch (err: unknown) {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [loadWorkspaceData]);

  // Browser navigation (popstate) listener
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const courseId = params.get("courseId");
      const assignmentId = params.get("assignmentId");

      if (courseId && courses.length > 0) {
        const matched = courses.find((c) => c.id === courseId);
        if (matched) {
          setSelectedCourse(matched);
          if (!assignmentId) {
            setActiveAssignmentForSubs(null);
            window.dispatchEvent(
              new CustomEvent("course-workspace-change", {
                detail: { course: matched, tab: "classwork", assignmentTitle: null },
              })
            );
          }
          loadWorkspaceData(matched.id, assignmentId);
        }
      } else {
        setSelectedCourse(null);
        setActiveAssignmentForSubs(null);
        window.dispatchEvent(
          new CustomEvent("course-workspace-change", {
            detail: { course: null, tab: "stream", assignmentTitle: null },
          })
        );
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [courses, loadWorkspaceData]);

  // Notify header when activeTab changes
  useEffect(() => {
    if (selectedCourse && !activeAssignmentForSubs) {
      window.dispatchEvent(
        new CustomEvent("course-workspace-change", {
          detail: { course: selectedCourse, tab: activeTab, assignmentTitle: null },
        })
      );
    }
  }, [activeTab, selectedCourse, activeAssignmentForSubs]);

  // Listen to cross-component course theme updates
  useEffect(() => {
    const handleThemeUpdate = (e: Event) => {
      const custom = e as CustomEvent<SavedCourseTheme & { courseId: string }>;
      if (custom.detail?.courseId) {
        setCourseThemes((prev) => ({
          ...prev,
          [custom.detail.courseId]: {
            themeId: custom.detail.themeId,
            patternId: custom.detail.patternId,
            imageUrl: custom.detail.imageUrl,
          },
        }));
      }
    };
    window.addEventListener("course-theme-updated", handleThemeUpdate);
    return () => window.removeEventListener("course-theme-updated", handleThemeUpdate);
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setActionSuccess(null);

    try {
      const newCourse = await createCourse({
        code,
        name,
        academic_year: academicYear,
        semester,
      });

      setActionSuccess(`Course ${newCourse.code} created successfully.`);
      setShowCreateModal(false);
      resetCourseForm();
      await loadCourses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create course.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    setIsSubmitting(true);
    setError(null);
    setActionSuccess(null);

    try {
      const updated = await updateCourse(selectedCourse.id, {
        code,
        name,
        academic_year: academicYear,
        semester,
        is_active: isActiveCourse,
      });

      setActionSuccess(`Course ${updated.code} updated successfully.`);
      setShowEditModal(false);
      resetCourseForm();
      await loadCourses();
      setSelectedCourse(updated);
      window.dispatchEvent(
        new CustomEvent("course-workspace-change", {
          detail: { course: updated, tab: activeTab, assignmentTitle: null },
        })
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update course.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async (course: Course, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Are you sure you want to permanently delete course "${course.code} - ${course.name}"?`)) return;

    setError(null);
    setActionSuccess(null);

    try {
      await deleteCourse(course.id);
      setActionSuccess(`Course ${course.code} deleted successfully.`);
      if (selectedCourse?.id === course.id) {
        handleCloseWorkspace();
      }
      await loadCourses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete course.");
    }
  };

  // Student & Assistant Unenrollment handlers
  const handleUnenrollStudent = async (student: StudentItem) => {
    if (!selectedCourse) return;
    if (!confirm(`Remove student ${student.username} (${student.email}) from ${selectedCourse.code}?`)) return;

    setError(null);
    setActionSuccess(null);

    try {
      await unenrollCourseStudent(selectedCourse.id, student.id);
      setActionSuccess(`Unenrolled student ${student.username} from this course.`);
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to unenroll student.");
    }
  };

  const handleRemoveStaff = async (staffMember: StaffItem) => {
    if (!selectedCourse) return;
    if (!confirm(`Remove teaching assistant ${staffMember.username} from ${selectedCourse.code}?`)) return;

    setError(null);
    setActionSuccess(null);

    try {
      await removeCourseStaff(selectedCourse.id, staffMember.id);
      setActionSuccess(`Removed assistant ${staffMember.username} from this course.`);
      setStaff((prev) => prev.filter((s) => s.id !== staffMember.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove assistant.");
    }
  };

  // Autocomplete Suggestions computation (Email "To:" style)
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

  // Tag chip multi-input helpers
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
        setActiveSuggestionIdx((prev) => (prev < userSuggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIdx((prev) => (prev > 0 ? prev - 1 : userSuggestions.length - 1));
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
    if (!selectedCourse) return;

    const currentTags = [...tags];
    if (tagInput.trim()) {
      const extra = tagInput.trim().split(/[\n,;\t ]+/).map((s) => s.trim()).filter(Boolean);
      extra.forEach((t) => {
        if (!currentTags.includes(t)) currentTags.push(t);
      });
    }

    if (currentTags.length === 0) {
      setEnrollModalError("Please add at least one username / student NPM.");
      return;
    }

    setIsSubmitting(true);
    setEnrollModalError(null);
    setError(null);
    setActionSuccess(null);

    try {
      if (enrollType === "student") {
        const res = await enrollCourseStudents(selectedCourse.id, currentTags);
        setActionSuccess(res.message || `Successfully enrolled ${currentTags.length} student(s).`);
      } else {
        const res = await assignCourseStaff(selectedCourse.id, currentTags);
        setActionSuccess(res.message || `Successfully assigned ${currentTags.length} assistant(s).`);
      }
      setShowEnrollModal(false);
      setTags([]);
      setTagInput("");
      setEnrollModalError(null);
      await loadWorkspaceData(selectedCourse.id);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to process enrollment.";
      setEnrollModalError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Module Queue & Upload Handler in Workspace
  const addModFilesToQueue = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    const validExts = [".pdf", ".docx"];

    Array.from(files).forEach((file) => {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (validExts.includes(ext)) {
        if (file.size <= 20 * 1024 * 1024) {
          validFiles.push(file);
        } else {
          setError(`File "${file.name}" exceeds maximum allowed size of 20MB.`);
        }
      } else {
        setError(
          `File "${file.name}" has unsupported format. Only .pdf and .docx are allowed.`
        );
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

  const handleUploadCourseModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || modUploadQueue.length === 0) return;

    setIsUploadingMod(true);
    setError(null);
    setActionSuccess(null);
    setModUploadProgress(null);

    try {
      const result = await createAndUploadMultipleModules(
        selectedCourse.id,
        modUploadQueue,
        (current, total, currentFileName) => {
          setModUploadProgress({ current, total, currentFileName });
        }
      );

      if (result.successCount > 0 && result.errors.length === 0) {
        setActionSuccess(
          `Successfully uploaded ${result.successCount} learning ${
            result.successCount === 1 ? "module" : "modules"
          }.`
        );
        setShowUploadModuleModal(false);
        setModUploadQueue([]);
      } else if (result.successCount > 0 && result.errors.length > 0) {
        setActionSuccess(
          `Partially uploaded ${result.successCount} of ${result.total} modules.`
        );
        const failedFilenames = new Set(result.errors.map((e) => e.filename));
        setModUploadQueue((prev) =>
          prev.filter((item) => failedFilenames.has(item.file.name))
        );
        setError(
          result.errors.map((e) => `${e.filename}: ${e.error}`).join(" | ")
        );
      } else {
        setError(
          `Failed to upload modules: ${result.errors
            .map((e) => e.error)
            .join(", ")}`
        );
      }

      const allMods = await fetchAdminModules();
      setCourseModules(allMods.filter((m) => m.course_id === selectedCourse.id));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to complete batch upload."
      );
    } finally {
      setIsUploadingMod(false);
      setModUploadProgress(null);
    }
  };

  // Announcement Handlers
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newAnnContent.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createAnnouncement(selectedCourse.id, {
        title: newAnnTitle.trim() || "Course Notice",
        content: newAnnContent.trim(),
        is_pinned: newAnnPinned,
      });
      setNewAnnTitle("");
      setNewAnnContent("");
      setNewAnnPinned(false);
      const updated = await fetchAnnouncements(selectedCourse.id);
      setAnnouncements(updated);
      setActionSuccess("Announcement broadcasted.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async (ann: AnnouncementItem) => {
    if (!selectedCourse) return;
    try {
      await updateAnnouncement(selectedCourse.id, ann.id, { is_pinned: !ann.is_pinned });
      const updated = await fetchAnnouncements(selectedCourse.id);
      setAnnouncements(updated);
      setActionSuccess(ann.is_pinned ? "Announcement unpinned." : "Announcement pinned to top.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update pin.");
    }
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    if (!selectedCourse || !confirm("Delete this announcement?")) return;
    try {
      await deleteAnnouncement(selectedCourse.id, annId);
      setAnnouncements((prev) => prev.filter((a) => a.id !== annId));
      setActionSuccess("Announcement deleted.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete announcement.");
    }
  };

  const handleAddComment = async (annId: string) => {
    if (!selectedCourse) return;
    const text = commentInputs[annId]?.trim();
    if (!text) return;

    try {
      await addAnnouncementComment(selectedCourse.id, annId, text);
      setCommentInputs((prev) => ({ ...prev, [annId]: "" }));
      const updated = await fetchAnnouncements(selectedCourse.id);
      setAnnouncements(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add comment.");
    }
  };

  const handleDeleteComment = async (annId: string, commentId: string) => {
    if (!selectedCourse) return;
    try {
      await deleteAnnouncementComment(selectedCourse.id, annId, commentId);
      const updated = await fetchAnnouncements(selectedCourse.id);
      setAnnouncements(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete comment.");
    }
  };

  // Assignment Handlers
  const formatDatetimeLocal = (isoString?: string | null): string => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "";
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  };

  const handleOpenCreateAssignment = () => {
    setEditingAssignment(null);
    setAssignTitle("");
    setAssignDesc("");
    setAssignMaxPoints(100);
    setAssignAllowedTypes("pdf,zip");
    setAssignDueDate("");
    setShowCreateAssignModal(true);
  };

  const handleOpenEditAssignment = (assignment: AssignmentItem) => {
    setEditingAssignment(assignment);
    setAssignTitle(assignment.title);
    setAssignDesc(assignment.description || "");
    setAssignMaxPoints(assignment.max_points);
    setAssignAllowedTypes(assignment.allowed_file_types || "pdf,zip");
    setAssignDueDate(formatDatetimeLocal(assignment.due_date));
    setShowCreateAssignModal(true);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !assignTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await createAssignment(selectedCourse.id, {
        title: assignTitle.trim(),
        description: assignDesc.trim(),
        due_date: assignDueDate ? new Date(assignDueDate).toISOString() : undefined,
        max_points: assignMaxPoints,
        allowed_file_types: assignAllowedTypes,
      });
      setShowCreateAssignModal(false);
      setEditingAssignment(null);
      setAssignTitle("");
      setAssignDesc("");
      setAssignDueDate("");
      const updated = await fetchAssignments(selectedCourse.id);
      setAssignments(updated);
      setActionSuccess("Assignment created.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !editingAssignment || !assignTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const updated = await updateAssignment(selectedCourse.id, editingAssignment.id, {
        title: assignTitle.trim(),
        description: assignDesc.trim(),
        due_date: assignDueDate ? new Date(assignDueDate).toISOString() : null,
        max_points: assignMaxPoints,
        allowed_file_types: assignAllowedTypes,
      });

      setShowCreateAssignModal(false);
      setEditingAssignment(null);
      setAssignTitle("");
      setAssignDesc("");
      setAssignDueDate("");

      const refreshed = await fetchAssignments(selectedCourse.id);
      setAssignments(refreshed);

      if (activeAssignmentForSubs?.id === editingAssignment.id) {
        setActiveAssignmentForSubs(updated);
        window.dispatchEvent(
          new CustomEvent("course-workspace-change", {
            detail: { course: selectedCourse, tab: "classwork", assignmentTitle: updated.title },
          })
        );
      }

      setActionSuccess(`Assignment "${updated.title}" updated successfully.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignId: string) => {
    if (!selectedCourse || !confirm("Delete this assignment?")) return;
    try {
      await deleteAssignment(selectedCourse.id, assignId);
      setAssignments((prev) => prev.filter((a) => a.id !== assignId));
      if (activeAssignmentForSubs?.id === assignId) {
        handleBackToClasswork();
      }
      setActionSuccess("Assignment deleted.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete assignment.");
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !activeAssignmentForSubs || !selectedSubForGrade) return;

    setIsSubmitting(true);
    try {
      await gradeAssignmentSubmission(
        selectedCourse.id,
        activeAssignmentForSubs.id,
        selectedSubForGrade.id,
        {
          score: Number(gradeScore),
          feedback: gradeFeedback.trim() || undefined,
        }
      );
      setSelectedSubForGrade(null);
      const subs = await fetchAssignmentSubmissions(selectedCourse.id, activeAssignmentForSubs.id);
      setSubmissionsList(subs);
      setActionSuccess("Submission graded successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to grade submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Session & Attendance Handlers
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !sessionTitle.trim() || !sessionDate) return;

    setIsSubmitting(true);
    try {
      await createCourseSession(selectedCourse.id, {
        title: sessionTitle.trim(),
        date: sessionDate,
      });
      setShowCreateSessionModal(false);
      setSessionTitle("");
      setSessionDate("");
      const sess = await fetchCourseSessions(selectedCourse.id);
      setSessions(sess);
      setActionSuccess("Class session created.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAttendance = async (session: ClassSessionItem) => {
    if (!selectedCourse) return;
    try {
      if (session.attendance_status === "OPEN") {
        await closeSessionAttendance(session.id);
        setActionSuccess("Attendance window closed.");
      } else {
        await openSessionAttendance(session.id);
        setActionSuccess("Attendance window opened.");
      }
      const sess = await fetchCourseSessions(selectedCourse.id);
      setSessions(sess);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to toggle attendance window.");
    }
  };

  const handleInspectSessionAttendance = async (session: ClassSessionItem) => {
    if (selectedSessionForAttendance?.id === session.id) {
      setSelectedSessionForAttendance(null);
      return;
    }

    setSelectedSessionForAttendance(session);
    setIsLoadingSessionAttendance(true);
    try {
      const aList = await fetchSessionAttendance(session.id).catch(() => []);
      setSessionAttendanceList(aList);
    } finally {
      setIsLoadingSessionAttendance(false);
    }
  };

  const handleUpdateStudentAttendanceInSession = async (
    sessionId: string,
    studentId: string,
    newStatus: "hadir" | "sakit" | "izin" | "alfa"
  ) => {
    setUpdatingStudentAttendanceId(studentId);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await updateSessionAttendance(sessionId, [
        { student_id: studentId, status: newStatus },
      ]);
      setActionSuccess(res.message || "Attendance status updated.");
      const aList = await fetchSessionAttendance(sessionId).catch(() => []);
      setSessionAttendanceList(aList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update attendance.");
    } finally {
      setUpdatingStudentAttendanceId(null);
    }
  };

  const resetCourseForm = () => {
    setCode("");
    setName("");
    setAcademicYear("2025/2026");
    setSemester("Ganjil");
    setIsActiveCourse(true);
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.academic_year.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStaff = staff.filter(
    (s) =>
      s.username.toLowerCase().includes(peopleSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(peopleSearch.toLowerCase())
  );

  const filteredStudents = students.filter(
    (st) =>
      st.username.toLowerCase().includes(peopleSearch.toLowerCase()) ||
      st.email.toLowerCase().includes(peopleSearch.toLowerCase())
  );

  const attendanceMap = new Map<string, AttendanceItem>();
  sessionAttendanceList.forEach((a) => {
    attendanceMap.set(a.student_id, a);
  });

  // Filtered submissions list
  const filteredSubmissions = useMemo(() => {
    return submissionsList.filter((sub) => {
      const matchesSearch =
        sub.student_username.toLowerCase().includes(submissionSearch.toLowerCase()) ||
        sub.file_name.toLowerCase().includes(submissionSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (submissionFilter === "graded") return sub.score !== null;
      if (submissionFilter === "pending") return sub.score === null;
      return true;
    });
  }, [submissionsList, submissionSearch, submissionFilter]);

  const gradedCount = submissionsList.filter((s) => s.score !== null).length;
  const pendingCount = submissionsList.filter((s) => s.score === null).length;

  const currentWorkspaceTheme = selectedCourse
    ? courseThemes[selectedCourse.id] || loadSavedCourseTheme(selectedCourse.id, selectedCourse.code)
    : { themeId: "midnight", patternId: "none" };

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {actionSuccess && (
        <div className="rounded-2xl bg-slate-900 border border-slate-200 px-4 py-3 text-xs font-medium text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-slate-400 hover:text-white">
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
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* VIEW 1: DEDICATED IN-PAGE COURSE WORKSPACE OR ASSIGNMENT SUBMISSIONS VIEW */}
      {selectedCourse ? (
        activeAssignmentForSubs ? (
          /* SUB-VIEW 1B: DEDICATED IN-PAGE ASSIGNMENT SUBMISSIONS WORKSPACE */
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Top Back Action & Navigation */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackToClasswork}
                className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-full shadow-xs transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Classwork</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Course: {selectedCourse.code}
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
                    {activeAssignmentForSubs.due_date && (
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <Clock3 className="w-3.5 h-3.5" />
                        <span>Due {new Date(activeAssignmentForSubs.due_date).toLocaleString()}</span>
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {activeAssignmentForSubs.title}
                  </h1>
                  <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                    {activeAssignmentForSubs.description || "No specific instructions provided."}
                  </p>
                </div>

                <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                      Max Score: {activeAssignmentForSubs.max_points} pts
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEditAssignment(activeAssignmentForSubs)}
                      className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-full flex items-center gap-1.5 apple-press shadow-xs transition-colors"
                      title="Edit Assignment Details"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit Task</span>
                    </button>
                  </div>
                  {activeAssignmentForSubs.allowed_file_types && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      Accepts: {activeAssignmentForSubs.allowed_file_types}
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
                    {submissionsList.length}
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
                      submissionFilter === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All ({submissionsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmissionFilter("pending")}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                      submissionFilter === "pending" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Needs Grading ({pendingCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmissionFilter("graded")}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                      submissionFilter === "graded" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
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
                    {submissionsList.length === 0
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
                            Turned in: {new Date(sub.submitted_at).toLocaleString()} • File: <span className="font-mono text-slate-700">{sub.file_name}</span>
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
                            <span>{sub.score} / {activeAssignmentForSubs.max_points} pts</span>
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
                                setPreviewDoc({
                                  title: `${sub.student_username} - ${sub.file_name}`,
                                  fileUrl: sub.download_url!,
                                  fileExtension: sub.file_name.split(".").pop() || "pdf",
                                  courseCode: selectedCourse.code,
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
                            setGradeScore(sub.score || 100);
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
          </div>
        ) : (
          /* SUB-VIEW 1A: STANDARD 4-TAB COURSE WORKSPACE */
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Customizable Classroom Header Banner */}
            <div className={`${!currentWorkspaceTheme.imageUrl ? getThemeConfig(currentWorkspaceTheme.themeId).gradientClass : "bg-slate-900"} rounded-3xl p-6 sm:p-8 text-white shadow-xs relative overflow-hidden`}>
              {/* Custom Image Background */}
              {currentWorkspaceTheme.imageUrl && (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${currentWorkspaceTheme.imageUrl})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/70" />
                </>
              )}

              {/* Pattern Overlay */}
              {currentWorkspaceTheme.patternId !== "none" && (
                <div className={`absolute inset-0 pointer-events-none ${getPatternConfig(currentWorkspaceTheme.patternId).overlayClass}`} />
              )}

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${getThemeConfig(currentWorkspaceTheme.themeId).badgeBg} px-3 py-1 rounded-full backdrop-blur-xs`}>
                    {selectedCourse.code}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-bold mt-3 text-white tracking-tight drop-shadow-xs">
                    {selectedCourse.name}
                  </h1>
                  <p className="text-xs text-slate-200 mt-1.5 flex items-center gap-2 drop-shadow-xs">
                    <Calendar className="w-4 h-4 text-white/70" />
                    <span>Academic Year {selectedCourse.academic_year} • Semester {selectedCourse.semester}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-white backdrop-blur-xs flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedCourse.is_active ? "bg-emerald-400" : "bg-amber-400"}`} />
                    <span>{selectedCourse.is_active ? "Active" : "Archived"}</span>
                    <span>•</span>
                    <span>{students.length} Enrolled • {staff.length} Asprak</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setBannerCustomTargetCourse(selectedCourse);
                      setShowCustomizeBannerModal(true);
                    }}
                    className="rounded-full border border-white/20 bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 backdrop-blur-xs shadow-xs"
                    title="Customize Course Banner Theme"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Customize</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCode(selectedCourse.code);
                      setName(selectedCourse.name);
                      setAcademicYear(selectedCourse.academic_year);
                      setSemester(selectedCourse.semester);
                      setIsActiveCourse(selectedCourse.is_active);
                      setShowEditModal(true);
                    }}
                    className="rounded-full border border-white/20 bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors flex items-center gap-1 backdrop-blur-xs shadow-xs"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content Area */}
            <div className="min-h-[400px]">
              {isLoadingWorkspace ? (
                <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-xs">
                  Loading workspace data...
                </div>
              ) : activeTab === "stream" ? (
                /* 1. STREAM TAB: Authentic Google Classroom 2-Column Grid */
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Left Side: Upcoming Deadlines & Next Session Interactive Cards */}
                  <div className="space-y-4 lg:col-span-1">
                    {/* Upcoming Deadlines Card */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-700" />
                          <span>Upcoming</span>
                        </h4>
                        {assignments.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setActiveTab("classwork")}
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 hover:underline"
                          >
                            View all
                          </button>
                        )}
                      </div>

                      {assignments.filter((a) => a.due_date).length === 0 ? (
                        <p className="text-xs text-slate-400">Woohoo, no work due soon!</p>
                      ) : (
                        <div className="space-y-1">
                          {assignments
                            .filter((a) => a.due_date)
                            .slice(0, 3)
                            .map((a) => (
                              <div
                                key={a.id}
                                onClick={() => handleOpenSubmissions(a)}
                                className="group p-2 -mx-2 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100"
                                title={`Open ${a.title} submissions`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-xs text-slate-800 block truncate group-hover:text-slate-900 group-hover:underline">
                                    {a.title}
                                  </span>
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                                </div>
                                <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                                  Due: {new Date(a.due_date!).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Next Session Card */}
                    <div
                      onClick={() => {
                        if (sessions.length > 0) {
                          setActiveTab("sessions");
                          handleInspectSessionAttendance(sessions[0]);
                        } else {
                          setActiveTab("sessions");
                        }
                      }}
                      className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2 hover:border-slate-300 hover:shadow-xs cursor-pointer group"
                      title="Go to session attendance management"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <CalendarCheck className="w-4 h-4 text-slate-700" />
                          <span>Next Session</span>
                        </h4>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>

                      {sessions.length === 0 ? (
                        <p className="text-xs text-slate-400">No sessions scheduled.</p>
                      ) : (
                        <div className="text-xs space-y-0.5">
                          <span className="font-semibold text-slate-800 block group-hover:text-slate-900 group-hover:underline truncate">
                            {sessions[0].title}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-medium">
                            Date: {sessions[0].date}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600 inline-flex items-center gap-1 pt-1">
                            <span>Manage Attendance</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Announcement Composer & Feed */}
                  <div className="space-y-5 lg:col-span-3">
                    {/* Announcement Composer */}
                    <form
                      onSubmit={handlePostAnnouncement}
                      className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3.5"
                    >
                      <input
                        type="text"
                        placeholder="Announcement title / headline..."
                        value={newAnnTitle}
                        onChange={(e) => setNewAnnTitle(e.target.value)}
                        className="w-full text-xs font-semibold px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
                      />
                      <textarea
                        placeholder="Announce something to your class..."
                        value={newAnnContent}
                        onChange={(e) => setNewAnnContent(e.target.value)}
                        required
                        rows={3}
                        className="w-full text-xs p-4 border border-slate-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400 resize-none"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={newAnnPinned}
                            onChange={(e) => setNewAnnPinned(e.target.checked)}
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                          />
                          <Pin className="w-3.5 h-3.5" />
                          <span>Pin to top of stream</span>
                        </label>
                        <button
                          type="submit"
                          disabled={isSubmitting || !newAnnContent.trim()}
                          className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Post Broadcast</span>
                        </button>
                      </div>
                    </form>

                    {/* Announcement Feed */}
                    {announcements.length === 0 ? (
                      <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-xs text-slate-400">
                        No announcements published in this stream yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {announcements.map((ann) => (
                          <div
                            key={ann.id}
                            className={`bg-white rounded-3xl border p-5 shadow-xs space-y-3 transition-all ${
                              ann.is_pinned ? "border-slate-400 bg-slate-50/40" : "border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                                  {ann.author_username ? ann.author_username.slice(0, 2).toUpperCase() : "AD"}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-xs text-slate-900">{ann.title}</h4>
                                    {ann.is_pinned && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900 text-white flex items-center gap-1">
                                        <Pin className="w-3 h-3" />
                                        <span>Pinned</span>
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    {ann.author_username} ({ann.author_role}) • {new Date(ann.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePin(ann)}
                                  className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                                    ann.is_pinned
                                      ? "text-slate-900 bg-slate-200 hover:bg-slate-300 font-semibold"
                                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                  }`}
                                  title={ann.is_pinned ? "Unpin notice" : "Pin notice"}
                                >
                                  {ann.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                                  <span className="text-[10px]">{ann.is_pinned ? "Unpin" : "Pin"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAnnouncement(ann.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition-colors"
                                  title="Delete notice"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="text-xs text-slate-700 whitespace-pre-wrap pl-12 leading-relaxed">
                              {ann.content}
                            </div>

                            {/* Discussion Comments */}
                            <div className="pl-12 pt-2 border-t border-slate-100 space-y-2">
                              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                <span>Discussion Comments ({ann.comments?.length || 0})</span>
                              </div>

                              {ann.comments && ann.comments.length > 0 && (
                                <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl">
                                  {ann.comments.map((c) => (
                                    <div key={c.id} className="text-xs flex items-start justify-between gap-2 group">
                                      <div>
                                        <span className="font-semibold text-slate-800">{c.author_username}: </span>
                                        <span className="text-slate-600">{c.content}</span>
                                        <span className="text-[10px] text-slate-400 ml-2">
                                          {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteComment(ann.id, c.id)}
                                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Write a comment / question..."
                                  value={commentInputs[ann.id] || ""}
                                  onChange={(e) => setCommentInputs({ ...commentInputs, [ann.id]: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddComment(ann.id);
                                    }
                                  }}
                                  className="flex-1 text-xs px-4 py-2 border border-slate-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddComment(ann.id)}
                                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full flex items-center gap-1 shadow-xs"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Send</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === "classwork" ? (
                /* 2. CLASSWORK TAB: Authentic Google Classroom Sectioned Layout */
                <div className="space-y-8">
                  {/* Top Action Bar */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Classwork & Materials</h3>
                      <p className="text-xs text-slate-500">Assignments, laboratory tasks, and downloadable modules</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowUploadModuleModal(true)}
                        className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-full shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Module</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenCreateAssignment}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full shadow-xs apple-press transition-colors flex items-center gap-1.5"
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
                        No assignments assigned yet. Click &quot;Create Assignment&quot; to assign coursework.
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
                                  {a.due_date ? `Due: ${new Date(a.due_date).toLocaleString()}` : "No due date"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleOpenSubmissions(a)}
                                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full text-xs flex items-center gap-1.5 apple-press transition-colors shadow-xs"
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>Submissions</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditAssignment(a)}
                                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs apple-press transition-colors"
                                title="Edit assignment"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAssignment(a.id)}
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
                        <span>Learning Materials & Modules ({courseModules.length})</span>
                      </h4>
                    </div>

                    {courseModules.length === 0 ? (
                      <div className="text-center p-8 bg-white border border-dashed border-slate-200 rounded-3xl text-xs text-slate-400">
                        No learning modules uploaded for this course yet. Click &quot;Upload Module&quot; to add guides.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {courseModules.map((m) => (
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
                                  {m.description || "No description provided."}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {m.download_url && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewDoc({
                                        title: m.title,
                                        fileUrl: m.download_url!,
                                        fileExtension: m.file_key.split(".").pop() || "pdf",
                                        courseCode: selectedCourse.code,
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
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                m.is_published ? "bg-slate-100 text-slate-800 border border-slate-200" : "bg-slate-50 text-slate-500 border border-slate-200"
                              }`}>
                                {m.is_published ? "Published" : "Draft"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === "people" ? (
                /* 3. PEOPLE TAB (INTUITIVE ROSTER & ENROLLMENT WITH UNENROLL) */
                <div className="space-y-6">
                  {/* Search Bar & Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <input
                        type="text"
                        placeholder="Search student NPM or assistant username..."
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
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-full flex items-center gap-1.5 transition-colors"
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
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-full shadow-xs flex items-center gap-1.5 transition-colors"
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
                      <p className="text-xs text-slate-400 italic py-2">No assistants matching criteria.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                        {filteredStaff.map((s) => (
                          <div key={s.id} className="p-3.5 sm:p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
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
                                onClick={() => handleRemoveStaff(s)}
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
                      <p className="text-xs text-slate-400 italic py-2">No students enrolled matching criteria.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 bg-white rounded-3xl border border-slate-200 max-h-96 overflow-y-auto shadow-xs">
                        {filteredStudents.map((st) => (
                          <div key={st.id} className="p-3.5 sm:p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
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
                                onClick={() => handleUnenrollStudent(st)}
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
                </div>
              ) : (
                /* 4. SESSIONS & ATTENDANCE TAB */
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-700" />
                      <span>Class Sessions & Live Attendance Windows</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCreateSessionModal(true)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Session</span>
                    </button>
                  </div>

                  {sessions.length === 0 ? (
                    <div className="text-center p-8 bg-white border border-dashed border-slate-200 rounded-3xl text-xs text-slate-400">
                      No class sessions scheduled yet. Click &quot;Add Session&quot; to create one.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((s) => {
                        const isInspecting = selectedSessionForAttendance?.id === s.id;
                        return (
                          <div key={s.id} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <span className="font-bold text-xs text-slate-900 block">{s.title}</span>
                                <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Calendar className="w-3 h-3" />
                                  <span>Date: {s.date}</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleInspectSessionAttendance(s)}
                                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                                    isInspecting
                                      ? "bg-slate-900 text-white"
                                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                  }`}
                                >
                                  <Users className="w-3.5 h-3.5" />
                                  <span>{isInspecting ? "Hide Attendance" : "Manage Attendance"}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleAttendance(s)}
                                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                                    s.attendance_status === "OPEN"
                                      ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                  }`}
                                >
                                  {s.attendance_status === "OPEN" ? (
                                    <>
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>Close Window</span>
                                    </>
                                  ) : (
                                    <>
                                      <Unlock className="w-3.5 h-3.5" />
                                      <span>Open Window</span>
                                    </>
                                  )}
                                </button>

                                <a
                                  href={getAttendanceExportUrl(s.id, "csv")}
                                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-full text-xs flex items-center gap-1 transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>CSV</span>
                                </a>
                              </div>
                            </div>

                            {/* Expanded Interactive Attendance Roster */}
                            {isInspecting && (
                              <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold text-slate-900">
                                    Attendance Roster for {s.title}
                                  </h4>
                                  <span className="text-[11px] text-slate-500">
                                    {students.length} student(s) enrolled
                                  </span>
                                </div>

                                {isLoadingSessionAttendance ? (
                                  <p className="text-xs text-slate-400 py-4 text-center">Loading attendance records...</p>
                                ) : students.length === 0 ? (
                                  <p className="text-xs text-slate-400 py-2">No students enrolled in this course.</p>
                                ) : (
                                  <div className="divide-y divide-slate-200/60 bg-white rounded-2xl border border-slate-200 overflow-hidden text-xs">
                                    {students.map((st) => {
                                      const record = attendanceMap.get(st.id);
                                      const currentStatus = record ? record.status : "Belum Absen";
                                      const isUpdatingThis = updatingStudentAttendanceId === st.id;

                                      return (
                                        <div key={st.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50">
                                          <div>
                                            <span className="font-semibold text-slate-900 block">{st.username}</span>
                                            <span className="text-[11px] text-slate-400">{st.email}</span>
                                          </div>

                                          <div className="flex items-center gap-1.5">
                                            {(["hadir", "sakit", "izin", "alfa"] as const).map((statusOption) => {
                                              const isCurrent = currentStatus === statusOption;
                                              return (
                                                <button
                                                  key={statusOption}
                                                  type="button"
                                                  onClick={() => handleUpdateStudentAttendanceInSession(s.id, st.id, statusOption)}
                                                  disabled={isUpdatingThis}
                                                  className={`px-3 py-1 text-[10px] font-semibold capitalize rounded-full transition-all ${
                                                    isCurrent
                                                      ? "bg-slate-900 text-white shadow-xs"
                                                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                                  } disabled:opacity-50`}
                                                >
                                                  {statusOption}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        /* VIEW 2: COURSE CATALOG & MANAGEMENT GRID/TABLE */
        <div className="space-y-5">
          {/* Action Bar & Search Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search course code, name, or academic year..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center bg-white border border-slate-200 rounded-full p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-full transition-colors ${
                    viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-full transition-colors ${
                    viewMode === "table" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetCourseForm();
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full shadow-xs transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Course</span>
              </button>
            </div>
          </div>

          {/* Courses Catalog Display */}
          {isLoading ? (
            <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-xs">
              Loading courses catalog...
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-xs">
              No practicum courses found matching your criteria.
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => {
                const cTheme = courseThemes[course.id] || loadSavedCourseTheme(course.id, course.code);
                const themeCfg = getThemeConfig(cTheme.themeId || getDeterministicThemeId(course.code));
                const patternCfg = getPatternConfig(cTheme.patternId);

                return (
                  <div
                    key={course.id}
                    onClick={() => handleOpenWorkspace(course)}
                    className="group bg-white rounded-3xl border border-slate-200 shadow-xs apple-card-hover overflow-hidden cursor-pointer flex flex-col justify-between"
                  >
                    {/* Customizable Card Header Banner */}
                    <div className={`${!cTheme.imageUrl ? themeCfg.gradientClass : "bg-slate-900"} p-5 text-white relative overflow-hidden`}>
                      {cTheme.imageUrl && (
                        <>
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${cTheme.imageUrl})` }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/70" />
                        </>
                      )}
                      {patternCfg.id !== "none" && (
                        <div className={`absolute inset-0 pointer-events-none ${patternCfg.overlayClass}`} />
                      )}
                      <div className="relative z-10 flex items-start justify-between">
                        <div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${themeCfg.badgeBg} px-2 py-0.5 rounded-md backdrop-blur-xs`}>
                            {course.code}
                          </span>
                          <h3 className="text-sm font-bold mt-2 text-white group-hover:underline line-clamp-1 drop-shadow-xs">
                            {course.name}
                          </h3>
                        </div>
                        <span className="text-[11px] font-medium bg-white/10 px-2 py-0.5 rounded-lg border border-white/10 backdrop-blur-xs">
                          {course.semester} {course.academic_year}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Academic Period</span>
                          <span className="font-medium text-slate-800">{course.academic_year}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Offering Status</span>
                          <span className="font-medium text-slate-800 flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${course.is_active ? "bg-emerald-500" : "bg-slate-400"} inline-block`} />
                            {course.is_active ? "Active" : "Archived"}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-900 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <span>Open Workspace</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBannerCustomTargetCourse(course);
                              setShowCustomizeBannerModal(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg text-xs transition-colors"
                            title="Customize Banner"
                          >
                            <Palette className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCourse(course);
                              setCode(course.code);
                              setName(course.name);
                              setAcademicYear(course.academic_year);
                              setSemester(course.semester);
                              setIsActiveCourse(course.is_active);
                              setShowEditModal(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg text-xs transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCourse(course, e)}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg text-xs transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3.5 pl-5">Code</th>
                    <th className="p-3.5">Course Name</th>
                    <th className="p-3.5">Academic Period</th>
                    <th className="p-3.5">Semester</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCourses.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleOpenWorkspace(c)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5 pl-5 font-semibold text-slate-900">{c.code}</td>
                      <td className="p-3.5 font-medium text-slate-800">{c.name}</td>
                      <td className="p-3.5 text-slate-600">{c.academic_year}</td>
                      <td className="p-3.5 text-slate-600">{c.semester}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          Active
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenWorkspace(c)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg text-xs"
                        >
                          Workspace
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCourse(c, e)}
                          className="px-3 py-1 hover:bg-rose-50 text-rose-600 font-medium rounded-lg text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Customize Course Banner Theme Modal */}
      {showCustomizeBannerModal && bannerCustomTargetCourse && (
        <CourseBannerCustomizerModal
          isOpen={showCustomizeBannerModal}
          course={bannerCustomTargetCourse}
          onClose={() => {
            setShowCustomizeBannerModal(false);
            setBannerCustomTargetCourse(null);
          }}
          onSaved={(savedTheme) => {
            setCourseThemes((prev) => ({
              ...prev,
              [bannerCustomTargetCourse.id]: savedTheme,
            }));
            setActionSuccess("Course banner updated successfully.");
          }}
        />
      )}

      {/* Grade Submission Form Modal */}
      {selectedSubForGrade && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleGradeSubmission} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h4 className="font-bold text-sm text-slate-900">
              Grade Submission: {selectedSubForGrade.student_username}
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Score (0 - {activeAssignmentForSubs?.max_points || 100})
                </label>
                <input
                  type="number"
                  min="0"
                  max={activeAssignmentForSubs?.max_points || 100}
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
                disabled={isSubmitting}
                className="px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 shadow-xs"
              >
                {isSubmitting ? "Saving..." : "Save Grade"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upload Module Modal in Course Workspace */}
      {showUploadModuleModal && selectedCourse && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleUploadCourseModule}
            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Upload Learning Modules
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Course: {selectedCourse.code} - {selectedCourse.name} ({selectedCourse.academic_year} {selectedCourse.semester})
                </p>
              </div>
              <button
                type="button"
                disabled={isUploadingMod}
                onClick={() => {
                  setShowUploadModuleModal(false);
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
                      Click to browse or drag & drop multiple files
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Supports PDF and DOCX (hold Shift/Ctrl to select multiple)
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
                                setModUploadQueue((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                );
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
                                prev.map((q, i) =>
                                  i === idx ? { ...q, title: val } : q
                                )
                              );
                            }}
                            placeholder="Module Title *"
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
                            placeholder="Description / Summary (Optional)"
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
                      Uploading {modUploadProgress.current} of{" "}
                      {modUploadProgress.total}...
                    </span>
                    <span>
                      {Math.round(
                        (modUploadProgress.current / modUploadProgress.total) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-200"
                      style={{
                        width: `${
                          (modUploadProgress.current / modUploadProgress.total) *
                          100
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
                  setShowUploadModuleModal(false);
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
                    <span>Uploading Queue...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>
                      Upload{" "}
                      {modUploadQueue.length > 0
                        ? `${modUploadQueue.length} ${
                            modUploadQueue.length === 1 ? "Module" : "Modules"
                          }`
                        : "Modules"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tag-Chip Multi-Input Enrollment Modal with In-Modal Error & Real-Time Suggestions */}
      {showEnrollModal && selectedCourse && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleEnrollSubmit}
            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  {enrollType === "student" ? "Enroll Students (Praktikan)" : "Assign Teaching Assistants (Asprak)"}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Course: {selectedCourse.code} - {selectedCourse.name}
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
                {enrollType === "student" ? "Student NPM / Username" : "Assistant Username / Email"}
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
                        ? "Type NPM / username and select from list..."
                        : "Type username / email and select from list..."
                      : "Add more..."
                  }
                  className="flex-1 min-w-[160px] text-xs bg-transparent border-none outline-none p-1 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Email-like Autocomplete Suggestions Dropdown */}
              {userSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100 max-h-56 overflow-y-auto">
                  <div className="px-3.5 py-1.5 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Matching {enrollType === "student" ? "Students" : "Teaching Staff"}</span>
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
                Tip: Type character matching NPM or email, or paste multiple usernames separated by commas.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowEnrollModal(false);
                  setEnrollModalError(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (tags.length === 0 && !tagInput.trim())}
                className="px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? "Enrolling..." : `Enroll ${tags.length + (tagInput.trim() ? 1 : 0)} Account(s)`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create / Edit Course Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <form
            onSubmit={showCreateModal ? handleCreateCourse : handleUpdateCourse}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-apple-modal"
          >
            <h4 className="font-bold text-sm text-slate-900">
              {showCreateModal ? "Create Practicum Course" : "Edit Course Offering"}
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Course Code (e.g. IF2101)</label>
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
              {showEditModal && (
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
                          {isActiveCourse ? "Active Offering" : "Archived (Historical)"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isActiveCourse
                          ? "Active course for the current academic semester."
                          : "Archived. Read-only historical record for previous semesters."}
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
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
                className="px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-50 apple-press transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 shadow-xs apple-press transition-all"
              >
                {isSubmitting ? "Saving..." : showCreateModal ? "Create Course" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateSessionModal && selectedCourse && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <form onSubmit={handleCreateSession} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-apple-modal">
            <h4 className="font-bold text-sm text-slate-900">Schedule Class Session</h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Session Title (e.g. Pertemuan 1 - HTML/CSS)</label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  required
                  placeholder="Pertemuan 1"
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Session Date</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateSessionModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 shadow-xs"
              >
                {isSubmitting ? "Creating..." : "Add Session"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create / Edit Assignment Modal */}
      {showCreateAssignModal && selectedCourse && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <form
            onSubmit={editingAssignment ? handleUpdateAssignment : handleCreateAssignment}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-apple-modal"
          >
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                {editingAssignment ? "Edit Assignment Task" : "Create New Assignment"}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {editingAssignment
                  ? `Update coursework specifications for ${selectedCourse.code}.`
                  : `Assign a new lab coursework or task for ${selectedCourse.code}.`}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  required
                  placeholder="Tugas 1 - Layouting Dashboard"
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 transition-shadow duration-150"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Instructions / Description</label>
                <textarea
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 resize-none transition-shadow duration-150"
                  placeholder="Task guidelines..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Max Points</label>
                <input
                  type="number"
                  value={assignMaxPoints}
                  onChange={(e) => setAssignMaxPoints(Number(e.target.value))}
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
                  {[
                    { id: "pdf", label: "PDF (.pdf)" },
                    { id: "zip", label: "ZIP (.zip)" },
                    { id: "rar", label: "RAR (.rar)" },
                    { id: "docx", label: "Word (.docx)" },
                    { id: "py", label: "Python (.py)" },
                    { id: "java", label: "Java (.java)" },
                    { id: "cpp", label: "C++ (.cpp)" },
                    { id: "sql", label: "SQL (.sql)" },
                    { id: "ipynb", label: "Jupyter (.ipynb)" },
                  ].map((fmt) => {
                    const activeTypes = assignAllowedTypes
                      .split(",")
                      .map((t) => t.trim().toLowerCase().replace(/^\./, ""))
                      .filter(Boolean);
                    const isSelected = activeTypes.includes(fmt.id);

                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => {
                          const currentSet = new Set(activeTypes);
                          if (isSelected) {
                            currentSet.delete(fmt.id);
                          } else {
                            currentSet.add(fmt.id);
                          }
                          const newTypes = Array.from(currentSet);
                          setAssignAllowedTypes(newTypes.length > 0 ? newTypes.join(",") : "pdf");
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer select-none ${
                          isSelected
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80"
                        }`}
                      >
                        {isSelected}
                        <span>{fmt.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 shrink-0">Selected / Custom:</span>
                  <input
                    type="text"
                    value={assignAllowedTypes}
                    onChange={(e) => setAssignAllowedTypes(e.target.value)}
                    placeholder="e.g. pdf,zip,docx"
                    className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-700 focus:bg-white focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Due Date & Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 transition-shadow duration-150"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowCreateAssignModal(false);
                  setEditingAssignment(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-50 apple-press transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 shadow-xs apple-press transition-all"
              >
                {isSubmitting ? "Saving..." : editingAssignment ? "Save Changes" : "Publish Assignment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* In-Browser Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={!!previewDoc}
          title={previewDoc.title}
          courseCode={previewDoc.courseCode}
          fileUrl={previewDoc.fileUrl}
          fileExtension={previewDoc.fileExtension}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
