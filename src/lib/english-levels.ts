/**
 * Canonical CEFR-related English levels used across homework, General English
 * tracks, and Placement Tests. Add C1/C2 here later — do not invent parallel
 * spellings (b1plus, B1 Plus, etc.) elsewhere.
 */
export const ENGLISH_LEVEL_IDS = ["A1", "A2", "B1", "B1+", "B2"] as const;

export type EnglishLevelId = (typeof ENGLISH_LEVEL_IDS)[number];

export type EnglishLevelMeta = {
  id: EnglishLevelId;
  label: string;
};

export const ENGLISH_LEVELS: EnglishLevelMeta[] = ENGLISH_LEVEL_IDS.map((id) => ({
  id,
  label: id,
}));

const LEVEL_SET = new Set<string>(ENGLISH_LEVEL_IDS);

export function isEnglishLevelId(value: string | null | undefined): value is EnglishLevelId {
  return typeof value === "string" && LEVEL_SET.has(value);
}

/** Persist only canonical ids (A1, A2, B1, B1+, B2). Unknown values become null. */
export function normalizeCefrLevel(value: string | null | undefined): EnglishLevelId | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (isEnglishLevelId(trimmed)) return trimmed;
  const compact = trimmed.toUpperCase().replace(/[\s_]/g, "");
  if (compact === "B1PLUS" || compact === "B1+") return "B1+";
  if (isEnglishLevelId(compact)) return compact;
  return null;
}

export function englishLevelLabel(id: string | null | undefined): string {
  if (!id) return "—";
  const match = ENGLISH_LEVELS.find((l) => l.id === id);
  return match?.label ?? id;
}

/** Lowest → highest. Safe to append C1, C2 at the end later. */
export function englishLevelRank(id: EnglishLevelId): number {
  return ENGLISH_LEVEL_IDS.indexOf(id);
}

export function placementTestTitle(level: EnglishLevelId): string {
  return `Placement Test ${level}`;
}
