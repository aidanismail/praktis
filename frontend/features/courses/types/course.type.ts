export type Semester = "Ganjil" | "Genap";

export type Course = {
  id: string;
  code: string;
  name: string;
  academic_year: string;
  semester: Semester;
  is_active: boolean;
};
