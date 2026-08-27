export const ASSIGNMENT_FILE_TYPES = ["pdf", "zip", "docx"] as const;

export type AssignmentFileType = (typeof ASSIGNMENT_FILE_TYPES)[number];

export type AssignmentSubmission = {
  id: string;
  assignment_id: string;
  student_id: string;
  student_username: string;
  student_email: string | null;
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
};
