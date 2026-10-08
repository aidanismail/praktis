import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { PersonalGradeHistoryItem } from "../types/grade.type";

export function listMyGrades() {
  return apiClient<PersonalGradeHistoryItem[]>(API_ENDPOINTS.grades.me, {
    method: "GET"
  });
}
