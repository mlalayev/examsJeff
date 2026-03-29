import type { ExamCategory } from "@/components/admin/exams/create/types";

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
