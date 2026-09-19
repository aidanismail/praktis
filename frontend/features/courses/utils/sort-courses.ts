import type { Course } from "../types/course.type";

export function sortCourses(courses: Course[]) {
  return [...courses].sort((first, second) => {
    const yearComparison = second.academic_year.localeCompare(
      first.academic_year
    );

    if (yearComparison !== 0) {
      return yearComparison;
    }

    return first.code.localeCompare(second.code);
  });
}
