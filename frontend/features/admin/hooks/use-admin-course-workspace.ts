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
  fetchSessionAttendance,
  fetchAdminUsers,
  enrollCourseStudents,
  assignCourseStaff,
  unenrollCourseStudent,
  removeCourseStaff,
  createCourseSession,
  deleteModule,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  addAnnouncementComment,
  deleteAnnouncementComment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  gradeAssignmentSubmission,
  openSessionAttendance,
  closeSessionAttendance,
  updateSessionAttendance,
} from "../api/admin.api";
import { adminQueryKeys } from "../constants/admin-query-keys";

export function useCourseWorkspace(courseId: string | null) {
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
  const invalidateModules = () =>
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.courseModules(cid) });
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

  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: string) => deleteModule(moduleId),
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
      }>;
    }) => updateAssignment(cid, assignmentId, data),
    onSuccess: invalidateAssignments,
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => deleteAssignment(cid, assignmentId),
    onSuccess: invalidateAssignments,
  });

  const refetchAllWorkspace = async () => {
    await Promise.all([
      studentsQuery.refetch(),
      staffQuery.refetch(),
      sessionsQuery.refetch(),
      modulesQuery.refetch(),
      announcementsQuery.refetch(),
      assignmentsQuery.refetch(),
      systemUsersQuery.refetch(),
    ]);
  };

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
    refetchAllWorkspace,
    // Mutations
    enrollStudents: enrollMutation.mutateAsync,
    assignStaff: assignStaffMutation.mutateAsync,
    unenrollStudent: unenrollStudentMutation.mutateAsync,
    removeStaff: removeStaffMutation.mutateAsync,
    createSession: createSessionMutation.mutateAsync,
    deleteModule: deleteModuleMutation.mutateAsync,
    createAnnouncement: createAnnouncementMutation.mutateAsync,
    updateAnnouncement: updateAnnouncementMutation.mutateAsync,
    deleteAnnouncement: deleteAnnouncementMutation.mutateAsync,
    addComment: addCommentMutation.mutateAsync,
    deleteComment: deleteCommentMutation.mutateAsync,
    createAssignment: createAssignmentMutation.mutateAsync,
    updateAssignment: updateAssignmentMutation.mutateAsync,
    deleteAssignment: deleteAssignmentMutation.mutateAsync,
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

  const gradeMutation = useMutation({
    mutationFn: ({
      submissionId,
      score,
      feedback,
    }: {
      submissionId: string;
      score: number;
      feedback?: string;
    }) =>
      gradeAssignmentSubmission(courseId, aid, submissionId, { score, feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.assignmentSubmissions(courseId, aid),
      });
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.courseAssignments(courseId),
      });
    },
  });

  return {
    submissions: submissionsQuery.data ?? [],
    isLoadingSubmissions: submissionsQuery.isLoading,
    refetchSubmissions: submissionsQuery.refetch,
    gradeSubmission: gradeMutation.mutateAsync,
    isGrading: gradeMutation.isPending,
  };
}

export function useSessionAttendance(sessionId: string | null, courseId?: string) {
  const queryClient = useQueryClient();
  const enabled = Boolean(sessionId);
  const sid = sessionId ?? "";

  const attendanceQuery = useQuery({
    queryKey: adminQueryKeys.sessionAttendance(sid),
    queryFn: () => fetchSessionAttendance(sid),
    enabled,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const toggleAttendanceMutation = useMutation({
    mutationFn: async (shouldOpen: boolean) => {
      if (shouldOpen) {
        return await openSessionAttendance(sid);
      }
      return await closeSessionAttendance(sid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.sessionAttendance(sid),
      });
      if (courseId) {
        queryClient.invalidateQueries({
          queryKey: adminQueryKeys.courseSessions(courseId),
        });
      }
    },
  });

  const updateRecordMutation = useMutation({
    mutationFn: (records: { student_id: string; status: "hadir" | "sakit" | "izin" | "alfa" }[]) =>
      updateSessionAttendance(sid, records),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.sessionAttendance(sid),
      });
    },
  });

  return {
    attendanceList: attendanceQuery.data ?? [],
    isLoadingAttendance: attendanceQuery.isLoading,
    refetchAttendance: attendanceQuery.refetch,
    toggleAttendance: toggleAttendanceMutation.mutateAsync,
    isTogglingAttendance: toggleAttendanceMutation.isPending,
    updateAttendance: updateRecordMutation.mutateAsync,
    isUpdatingAttendance: updateRecordMutation.isPending,
  };
}
