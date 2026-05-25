import {
  LessonCategory,
  WordListCategory,
  TrickCategory,
  Prisma,
} from "@prisma/client";

/** URL slug → DB enum value. Throws if invalid. */
export const LESSON_CATEGORY_BY_SLUG: Record<string, LessonCategory> = {
  ielts: LessonCategory.IELTS,
  toefl: LessonCategory.TOEFL,
  sat: LessonCategory.SAT,
  general: LessonCategory.GENERAL_ENGLISH,
  kids: LessonCategory.KIDS,
};

export const WORDLIST_CATEGORY_BY_SLUG: Record<string, WordListCategory> = {
  general: WordListCategory.GENERAL,
  sat: WordListCategory.SAT,
  ielts: WordListCategory.IELTS,
};

export const TRICK_CATEGORY_BY_SLUG: Record<string, TrickCategory> = {
  writing: TrickCategory.WRITING,
  desmos: TrickCategory.DESMOS,
};

export function parseLessonCategory(slug: string): LessonCategory {
  const v = LESSON_CATEGORY_BY_SLUG[slug.toLowerCase()];
  if (!v) throw new Error(`Unknown lesson category: ${slug}`);
  return v;
}

export function parseWordListCategory(slug: string): WordListCategory {
  const v = WORDLIST_CATEGORY_BY_SLUG[slug.toLowerCase()];
  if (!v) throw new Error(`Unknown word list category: ${slug}`);
  return v;
}

export function parseTrickCategory(slug: string): TrickCategory {
  const v = TRICK_CATEGORY_BY_SLUG[slug.toLowerCase()];
  if (!v) throw new Error(`Unknown trick category: ${slug}`);
  return v;
}

/** Sane default page sizes — protects the DB from accidental large fetches. */
export const DEFAULT_LIST_LIMIT = 24;
export const MAX_LIST_LIMIT = 100;

export function clampLimit(raw: string | number | null | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIST_LIMIT;
  return Math.min(Math.floor(n), MAX_LIST_LIMIT);
}

/**
 * Reusable Prisma where clause for "published content by category".
 * Branch admins / boss / creator can be allowed to see drafts by extending
 * the caller, but the student-facing API only ever uses isPublished: true.
 */
export function publishedByCategory<TCategoryKey extends string>(
  field: TCategoryKey,
  category: string
): Record<string, unknown> {
  return { [field]: category, isPublished: true };
}

/** Shape returned by list endpoints — kept stable for the client. */
export type LessonListItem = {
  id: string;
  title: string;
  slug: string;
  level: string | null;
  summary: string | null;
  coverImage: string | null;
  durationMin: number | null;
  order: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progressPct: number;
};

export type WordListItem = {
  id: string;
  title: string;
  slug: string;
  level: string | null;
  description: string | null;
  order: number;
  totalWords: number;
  mastered: number;
};

export type TrickListItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  coverImage: string | null;
  videoUrl: string | null;
  order: number;
  saved: boolean;
};

/** Decimal-aware JSON safe stringifier for any Prisma payload. */
export function toJsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_k, v) =>
      typeof v === "bigint"
        ? v.toString()
        : v instanceof Prisma.Decimal
          ? v.toString()
          : v
    )
  );
}
