export type Semester = "Ganjil" | "Genap";

export type Course = {
  id: string;
  code: string;
  name: string;
  academic_year: string;
  semester: Semester;
  is_active: boolean;
  banner_theme_id?: string | null;
  banner_pattern_id?: string | null;
  banner_image_url?: string | null;
};
