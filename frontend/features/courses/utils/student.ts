import type { EnrolledStudent } from "../types/enrolled-student.type";

/** Full name when the backend sends one, otherwise the username (NPM). */
export function getStudentDisplayName(student: Pick<EnrolledStudent, "name" | "username">) {
  return student.name?.trim() || student.username;
}

/** Sort by name (falling back to username), then username, then id. */
export function compareStudents(left: EnrolledStudent, right: EnrolledStudent) {
  const byName = getStudentDisplayName(left).localeCompare(
    getStudentDisplayName(right),
    undefined,
    { sensitivity: "base" }
  );
  if (byName !== 0) return byName;
  const byUsername = left.username.localeCompare(right.username);
  return byUsername !== 0 ? byUsername : left.id.localeCompare(right.id);
}
