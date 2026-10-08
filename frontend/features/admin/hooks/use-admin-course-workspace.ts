"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCourseStudents,
  fetchCourseStaff,
  fetchCourseSessions,
  fetchAdminModules,
  fetchAnnouncements,
  fetchAssignments,
  fetchAssignmentSubmissions,
  fetchAdminUsers,
  enrollCourseStudents,
  assignCourseStaff,
  unenrollCourseStudent,
  removeCourseStaff,
  createCourseSession,
  deleteModule,
  publishModule,
  unpublishModule,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  addAnnouncementComment,
  deleteAnnouncementComment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  setAssignmentGradesPublished,
  openSessionAttendance,
  closeSessionAttendance,
} from "../api/admin.api";
import {
  deleteCourseSession,
  updateCourseSession,
} from "@/features/sessions/api/sessions.api";
import { adminQueryKeys } from "../constants/admin-query-keys";

type CourseWorkspaceOptions = {
  loadSystemUsers?: boolean;
};

export function useCourseWorkspace(
  courseId: string | null,
  { loadSystemUsers = false }: CourseWorkspaceOptions = {}
) {
  const queryClient = useQueryClient();
  const enabled = Boolean(courseId);
  const cid = courseId ?? "";

  const studentsQuery = useQuery({
    queryKey: adminQueryKeys.courseStudents(cid),
    queryFn: () => fetchCourseStudents(cid),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const staffQuery = useQuery({
    queryKey: adminQueryKeys.courseStaff(cid),
    queryFn: () => fetchCourseStaff(cid),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const sessionsQuery = useQuery({
    queryKey: adminQueryKeys.courseSessions(cid),
    queryFn: () => fetchCourseSessions(cid),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const modulesQuery = useQuery({
    queryKey: adminQueryKeys.courseModules(cid),
    queryFn: async () => {
      const all = await fetchAdminModules();
      return all.filter((m) => m.course_id === cid);
    },
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const announcementsQuery = useQuery({
    queryKey: adminQueryKeys.courseAnnouncements(cid),
    queryFn: () => fetchAnnouncements(cid),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const assignmentsQuery = useQuery({
    queryKey: adminQueryKeys.courseAssignments(cid),
    queryFn: () => fetchAssignments(cid),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const systemUsersQuery = useQuery({
    queryKey: adminQueryKeys.users(),
    queryFn: fetchAdminUsers,
    enabled: loadSystemUsers,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Invalidation helpers
  const invalidateStudents = () =>
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.courseStudents(cid) });
  const invalidateStaff = () =>
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.courseStaff(cid) });
  const invalidateSessions = () =>
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.courseSessions(cid) });
  const invalidateModules = () => {
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.modules() });
    return queryClient.invalidateQueries({ queryKey: adminQueryKeys.courseModules(cid) });
  };
  const invalidateAnnouncements = () =>
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.courseAnnouncements(cid) });
  const invalidateAssignments = () =>
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.courseAssignments(cid) });

  // Mutations
  const enrollMutation = useMutation({
    mutationFn: (usernames: string[]) => enrollCourseStudents(cid, usernames),
    onSuccess: invalidateStudents,
  });

  const assignStaffMutation = useMutation({
    mutationFn: (usernames: string[]) => assignCourseStaff(cid, usernames),
    onSuccess: invalidateStaff,
  });

  const unenrollStudentMutation = useMutation({
    mutationFn: (studentId: string) => unenrollCourseStudent(cid, studentId),
    onSuccess: invalidateStudents,
  });

  const removeStaffMutation = useMutation({
    mutationFn: (userId: string) => removeCourseStaff(cid, userId),
    onSuccess: invalidateStaff,
  });

  const createSessionMutation = useMutation({
    mutationFn: (data: { title: string; date: string }) =>
      createCourseSession(cid, data),
    onSuccess: invalidateSessions,
  });

  const renameSessionMutation = useMutation({
    mutationFn: ({ sessionId, title }: { sessionId: string; title: string }) =>
      updateCourseSession(sessionId, { title }),
    onSuccess: invalidateSessions,
  });

  const changeSessionDateMutation = useMutation({
    mutationFn: ({ sessionId, date }: { sessionId: string; date: string }) =>
      updateCourseSession(sessionId, { date }),
    onSuccess: invalidateSessions,
  });

  const setSessionWindowMutation = useMutation({
    mutationFn: ({ sessionId, open }: { sessionId: string; open: boolean }) =>
      open ? openSessionAttendance(sessionId) : closeSessionAttendance(sessionId),
    onSuccess: invalidateSessions,
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => deleteCourseSession(sessionId),
    onSuccess: () => {
      invalidateSessions();
      // Deleting a session unlinks its assignments.
      invalidateAssignments();
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: string) => deleteModule(moduleId),
    onSuccess: invalidateModules,
  });

  const setModulePublishedMutation = useMutation({
    mutationFn: ({ moduleId, published }: { moduleId: string; published: boolean }) =>
      published ? publishModule(moduleId) : unpublishModule(moduleId),
    onSuccess: invalidateModules,
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: (data: { title: string; content: string; is_pinned?: boolean }) =>
      createAnnouncement(cid, data),
    onSuccess: invalidateAnnouncements,
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: ({
      announcementId,
      data,
    }: {
      announcementId: string;
      data: Partial<{ title: string; content: string; is_pinned: boolean }>;
    }) => updateAnnouncement(cid, announcementId, data),
    onSuccess: invalidateAnnouncements,
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (announcementId: string) => deleteAnnouncement(cid, announcementId),
    onSuccess: invalidateAnnouncements,
  });

  const addCommentMutation = useMutation({
    mutationFn: ({
      announcementId,
      content,
    }: {
      announcementId: string;
      content: string;
    }) => addAnnouncementComment(cid, announcementId, content),
    onSuccess: invalidateAnnouncements,
  });

  const deleteCommentMutation = useMutation({
    mutationFn: ({
      announcementId,
      commentId,
    }: {
      announcementId: string;
      commentId: string;
    }) => deleteAnnouncementComment(cid, announcementId, commentId),
    onSuccess: invalidateAnnouncements,
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      due_date?: string | null;
      max_points?: number;
      allowed_file_types?: string;
      is_published?: boolean;
      allow_late_submissions?: boolean;
    }) => createAssignment(cid, data),
    onSuccess: invalidateAssignments,
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({
      assignmentId,
      data,
    }: {
      assignmentId: string;
      data: Partial<{
        title: string;
        description: string;
        due_date: string | null;
        max_points: number;
        allowed_file_types: string;
        is_published: boolean;
        allow_late_submissions: boolean;
      }>;
    }) => updateAssignment(cid, assignmentId, data),
    onSuccess: invalidateAssignments,
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => deleteAssignment(cid, assignmentId),
    onSuccess: invalidateAssignments,
  });

  const isLoadingWorkspace =
    studentsQuery.isLoading ||
    staffQuery.isLoading ||
    sessionsQuery.isLoading ||
    modulesQuery.isLoading ||
    announcementsQuery.isLoading ||
    assignmentsQuery.isLoading;

  return {
    students: studentsQuery.data ?? [],
    staff: staffQuery.data ?? [],
    sessions: sessionsQuery.data ?? [],
    courseModules: modulesQuery.data ?? [],
    announcements: announcementsQuery.data ?? [],
    assignments: assignmentsQuery.data ?? [],
    systemUsers: systemUsersQuery.data ?? [],
    isLoadingWorkspace,
    // Mutations
    enrollStudents: enrollMutation.mutateAsync,
    assignStaff: assignStaffMutation.mutateAsync,
    unenrollStudent: unenrollStudentMutation.mutateAsync,
    removeStaff: removeStaffMutation.mutateAsync,
    createSession: createSessionMutation.mutateAsync,
    renameSession: renameSessionMutation.mutateAsync,
    changeSessionDate: changeSessionDateMutation.mutateAsync,
    setSessionWindow: setSessionWindowMutation.mutateAsync,
    deleteSession: deleteSessionMutation.mutateAsync,
    deleteModule: deleteModuleMutation.mutateAsync,
    setModulePublished: setModulePublishedMutation.mutateAsync,
    createAnnouncement: createAnnouncementMutation.mutateAsync,
    updateAnnouncement: updateAnnouncementMutation.mutateAsync,
    deleteAnnouncement: deleteAnnouncementMutation.mutateAsync,
    addComment: addCommentMutation.mutateAsync,
    deleteComment: deleteCommentMutation.mutateAsync,
    createAssignment: createAssignmentMutation.mutateAsync,
    updateAssignment: updateAssignmentMutation.mutateAsync,
    isSavingAssignment:
      createAssignmentMutation.isPending || updateAssignmentMutation.isPending,
    deleteAssignment: deleteAssignmentMutation.mutateAsync,
    isDeletingAssignment: deleteAssignmentMutation.isPending,
    invalidateModules,
    invalidateSessions,
  };
}

export function useAssignmentSubmissions(courseId: string, assignmentId: string | null) {
  const queryClient = useQueryClient();
  const enabled = Boolean(courseId && assignmentId);
  const aid = assignmentId ?? "";

  const submissionsQuery = useQuery({
    queryKey: adminQueryKeys.assignmentSubmissions(courseId, aid),
    queryFn: () => fetchAssignmentSubmissions(courseId, aid),
    enabled,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  const publishMutation = useMutation({
    mutationFn: (published: boolean) =>
      setAssignmentGradesPublished(courseId, aid, published),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.courseAssignments(courseId),
      }),
  });

  return {
    submissions: submissionsQuery.data ?? [],
    isLoadingSubmissions: submissionsQuery.isLoading,
    refetchSubmissions: submissionsQuery.refetch,
    setGradesPublished: (published: boolean) => {
      publishMutation.reset();
      return publishMutation.mutateAsync(published);
    },
    isPublishing: publishMutation.isPending,
    publishError: publishMutation.error,
  };
}
