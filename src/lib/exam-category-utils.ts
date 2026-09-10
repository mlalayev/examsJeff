import type { ExamCategory } from "@/components/admin/exams/create/types";

export const EXAM_CATEGORIES: ExamCategory[] = [
  "IELTS",
  "TOEFL",
  "SAT",
  "GENERAL_ENGLISH",
  "MATH",
  "KIDS",
  "PLACEMENT",
];

export const EXAM_CATEGORY_LABELS: Record<ExamCategory, string> = {
  IELTS: "IELTS",
  TOEFL: "TOEFL",
  SAT: "SAT",
  GENERAL_ENGLISH: "General English",
  MATH: "Math",
  KIDS: "Kids",
  PLACEMENT: "Placement Test",
};

/** Visual IA groups for the Exams list (records stay separate by category). */
export const EXAM_CATEGORY_GROUPS: {
  id: string;
  label: string;
  description: string;
  categories: ExamCategory[];
}[] = [
  {
    id: "academic_international",
    label: "Academic / International Exams",
    description: "SAT and IELTS exam catalogs",
    categories: ["SAT", "IELTS"],
  },
  {
    id: "english_programs",
    label: "English Programs",
    description: "General English exams",
    categories: ["GENERAL_ENGLISH"],
  },
  {
    id: "placement_tests",
    label: "Placement Tests",
    description: "English proficiency placement (A1–B2)",
    categories: ["PLACEMENT"],
  },
  {
    id: "other",
    label: "Other Programs",
    description: "TOEFL, Math, and Kids",
    categories: ["TOEFL", "MATH", "KIDS"],
  },
];

export function getExamCategoryLabel(category: string | null | undefined): string {
  if (!category) return "—";
  return EXAM_CATEGORY_LABELS[category as ExamCategory] ?? category;
}

export function isPlacementExam(category: string | null | undefined): boolean {
  return category === "PLACEMENT";
}

/**
 * Maps ExamCategory enums to URL-safe slugs
 */
export const CATEGORY_SLUG_MAP: Record<ExamCategory, string> = {
  IELTS: "ielts",
  TOEFL: "toefl",
  SAT: "sat",
  GENERAL_ENGLISH: "general-english",
  MATH: "math",
  KIDS: "kids",
  PLACEMENT: "placement",
};

/**
 * Reverse map: slug → ExamCategory
 */
export const SLUG_CATEGORY_MAP: Record<string, ExamCategory> = {
  ielts: "IELTS",
  toefl: "TOEFL",
  sat: "SAT",
  "general-english": "GENERAL_ENGLISH",
  math: "MATH",
  kids: "KIDS",
  placement: "PLACEMENT",
};

/**
 * Convert ExamCategory to URL slug
 */
export function categoryToSlug(category: ExamCategory): string {
  return CATEGORY_SLUG_MAP[category];
}

/**
 * Convert URL slug to ExamCategory, or null if invalid
 */
export function slugToCategory(slug: string): ExamCategory | null {
  return SLUG_CATEGORY_MAP[slug.toLowerCase()] || null;
}

/**
 * Check if a slug is a valid exam category
 */
export function isValidCategorySlug(slug: string): boolean {
  return slug.toLowerCase() in SLUG_CATEGORY_MAP;
}
