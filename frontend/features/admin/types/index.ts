export type { Course } from "@/features/courses/types/course.type";
export type {
  AdminModuleItem,
  AdminModuleItem as CourseModule,
  ImportCsvResponse,
} from "./admin.type";
export type {
  ClassSessionItem,
  ClassSessionItem as CourseSession,
  AttendanceItem,
  AttendanceItem as SessionAttendanceItem,
  StudentItem,
  StudentItem as CourseStudent,
  StaffItem,
  StaffItem as CourseStaff,
  AnnouncementItem,
  AnnouncementCommentItem,
  SubmissionItem,
  SubmissionItem as AssignmentSubmission,
  AssignmentItem,
  AssignmentItem as Assignment,
  ModuleBatchUploadItem as ModUploadQueueItem,
  ModuleBatchUploadResult,
  CreateAdminUserInput,
} from "../api/admin.api";
export type { User as AdminUser } from "@/types/user.type";

export type ModUploadProgress = {
  current: number;
  total: number;
  currentFileName: string;
};

