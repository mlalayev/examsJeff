import type { BuilderSaveConfig } from "@/components/admin/exams/create/GenericExamBuilder";

export type HomeworkDashboardRole = "admin" | "creator" | "teacher";

export function getHomeworkDashboardBase(role: HomeworkDashboardRole): string {
  if (role === "creator") return "/dashboard/creator/homework";
  if (role === "teacher") return "/dashboard/teacher/homework";
  return "/dashboard/admin/homework";
}

export function getHomeworkSaveConfig(
  role: HomeworkDashboardRole
): BuilderSaveConfig {
  const base = getHomeworkDashboardBase(role);
  return {
    createUrl: "/api/admin/homework/templates",
    updateUrl: (id) => `/api/admin/exams/${id}`,
    successRedirect: () => base,
    backHref: base,
    entityLabel: "Homework",
  };
}

export const HOMEWORK_CREATE_CATEGORIES = [
  "IELTS",
  "TOEFL",
  "SAT",
  "GENERAL_ENGLISH",
  "MATH",
  "KIDS",
] as const;
