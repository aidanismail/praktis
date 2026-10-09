import { ASSIGNMENT_FILE_TYPE_OPTIONS } from "@/lib/generated/upload-rules";

export type AssignmentFileType = (typeof ASSIGNMENT_FILE_TYPE_OPTIONS)[number]["id"];

export const ASSIGNMENT_FILE_TYPES = ASSIGNMENT_FILE_TYPE_OPTIONS.map(
  (option) => option.id
) as unknown as readonly [AssignmentFileType, ...AssignmentFileType[]];

export type AssignmentSubmission = {
  id: string;
  assignment_id: string;
  student_id: string;
  student_username: string;
  student_email: string | null;
  student_name?: string | null;
  file_name: string;
  file_size: number;
  download_url: string;
  submitted_at: string;
  is_late: boolean;
  score: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  status: string;
};

export type Assignment = {
  id: string;
  course_id: string;
  session_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  max_points: number;
  allowed_file_types: string;
  is_published: boolean;
  allow_late_submissions: boolean;
  grades_published: boolean;
  grades_published_at: string | null;
  created_at: string;
  submissions_count: number;
  my_submission: AssignmentSubmission | null;
};

export type CreateAssignmentPayload = {
  title: string;
  description: string | null;
  due_date: string | null;
  max_points: number;
  allowed_file_types: string;
  is_published: boolean;
  allow_late_submissions?: boolean;
};

export type UpdateAssignmentPayload = {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  max_points?: number;
  allowed_file_types?: string;
  is_published?: boolean;
  allow_late_submissions?: boolean;
};

export type GradeSubmissionPayload = {
  score: number;
  feedback: string | null;
};
