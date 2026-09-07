import type { ExamCategory } from "@/components/admin/exams/create/types";
import { STUDY_TYPES } from "@/lib/study-types";

export { ENGLISH_LEVELS, type EnglishLevelId } from "@/lib/english-levels";

/** Lesson / course this homework belongs to (aligned with student study types). */
export const HOMEWORK_SUBJECTS = STUDY_TYPES.map((s) => ({
  id: s.id,
  label: s.label,
}));

const SUBJECT_TO_CATEGORY: Record<string, ExamCategory> = {
  IELTS: "IELTS",
  TOEFL: "TOEFL",
  DUOLINGO: "TOEFL",
  SAT_VERBAL: "SAT",
  SAT_MATH: "SAT",
  MATH: "MATH",
  CALCULUS: "MATH",
  DIM: "MATH",
  SUBJECT_LESSONS: "MATH",
  KIDS: "KIDS",
  GENERAL_ENGLISH: "GENERAL_ENGLISH",
};

export function homeworkSubjectToCategory(subjectId: string): ExamCategory | null {
  return SUBJECT_TO_CATEGORY[subjectId] ?? null;
}

export function getHomeworkSubjectLabel(subjectId: string | null | undefined): string {
  if (!subjectId) return "—";
  return HOMEWORK_SUBJECTS.find((s) => s.id === subjectId)?.label ?? subjectId;
}

export function isEnglishSubject(subjectId: string): boolean {
  return subjectId === "GENERAL_ENGLISH";
}

export function formatHomeworkLevel(
  subjectId: string | null | undefined,
  track: string | null | undefined
): string | null {
  if (!isEnglishSubject(subjectId ?? "")) return null;
  return track?.trim() || null;
}
