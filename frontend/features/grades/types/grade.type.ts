export type PersonalGradeHistoryItem = {
  id: string;
  session_id: string | null;
  assignment_id?: string | null;
  item_type?: "session" | "assignment";
  session_title: string;
  session_date: string | null;
  course_id: string;
  course_code: string;
  course_name: string;
  academic_year: string;
  semester: string;
  score: number;
  max_points: number;
  feedback?: string | null;
  created_at: string;
  updated_at: string;
  recorded_by: string | null;
};
