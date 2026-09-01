export type SessionGrade = {
  id: string;
  session_id: string;
  student_id: string;
  score: number;
  created_at: string;
  updated_at: string;
  recorded_by: string | null;
};

export type GradeUpdate = {
  student_id: string;
  score: number;
};

export type BulkGradePayload = {
  records: GradeUpdate[];
};

export type GradeMessageResponse = {
  message: string;
};

export type PersonalGradeHistoryItem = {
  id: string;
  session_id: string;
  session_title: string;
  session_date: string | null;
  course_id: string;
  course_code: string;
  course_name: string;
  academic_year: string;
  semester: string;
  score: number;
  created_at: string;
  updated_at: string;
  recorded_by: string | null;
};
