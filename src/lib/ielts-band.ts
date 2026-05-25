/**
 * IELTS band score conversion utilities.
 *
 * Converts raw correct-answer counts (out of 40 for Listening/Reading)
 * to IELTS band scores (0.0 - 9.0 in 0.5 increments) using the
 * official British Council / IDP / Cambridge conversion tables.
 *
 * - Listening: same scale for Academic and General Training
 * - Reading: separate scales for Academic and General Training
 * - Writing/Speaking: not raw-score based (graded by examiners/AI)
 *
 * Reference: https://takeielts.britishcouncil.org/ielts-band-scores
 */

export type IeltsReadingType = "ACADEMIC" | "GENERAL_TRAINING";

type BandRow = { min: number; max: number; band: number };

/** Listening band table — same for Academic and General Training. */
const LISTENING_TABLE: BandRow[] = [
  { min: 39, max: 40, band: 9.0 },
  { min: 37, max: 38, band: 8.5 },
  { min: 35, max: 36, band: 8.0 },
  { min: 32, max: 34, band: 7.5 },
  { min: 30, max: 31, band: 7.0 },
  { min: 26, max: 29, band: 6.5 },
  { min: 23, max: 25, band: 6.0 },
  { min: 18, max: 22, band: 5.5 },
  { min: 16, max: 17, band: 5.0 },
  { min: 13, max: 15, band: 4.5 },
  { min: 11, max: 12, band: 4.0 },
  { min: 8, max: 10, band: 3.5 },
  { min: 6, max: 7, band: 3.0 },
  { min: 4, max: 5, band: 2.5 },
  { min: 3, max: 3, band: 2.0 },
  { min: 2, max: 2, band: 1.5 },
  { min: 1, max: 1, band: 1.0 },
  { min: 0, max: 0, band: 0.0 },
];

/** Reading band table — Academic. */
const READING_ACADEMIC_TABLE: BandRow[] = [
  { min: 39, max: 40, band: 9.0 },
  { min: 37, max: 38, band: 8.5 },
  { min: 35, max: 36, band: 8.0 },
  { min: 33, max: 34, band: 7.5 },
  { min: 30, max: 32, band: 7.0 },
  { min: 27, max: 29, band: 6.5 },
  { min: 23, max: 26, band: 6.0 },
  { min: 19, max: 22, band: 5.5 },
  { min: 15, max: 18, band: 5.0 },
  { min: 13, max: 14, band: 4.5 },
  { min: 10, max: 12, band: 4.0 },
  { min: 8, max: 9, band: 3.5 },
  { min: 6, max: 7, band: 3.0 },
  { min: 4, max: 5, band: 2.5 },
  { min: 3, max: 3, band: 2.0 },
  { min: 2, max: 2, band: 1.5 },
  { min: 1, max: 1, band: 1.0 },
  { min: 0, max: 0, band: 0.0 },
];

/** Reading band table — General Training. */
const READING_GENERAL_TABLE: BandRow[] = [
  { min: 40, max: 40, band: 9.0 },
  { min: 39, max: 39, band: 8.5 },
  { min: 37, max: 38, band: 8.0 },
  { min: 36, max: 36, band: 7.5 },
  { min: 34, max: 35, band: 7.0 },
  { min: 32, max: 33, band: 6.5 },
  { min: 30, max: 31, band: 6.0 },
  { min: 27, max: 29, band: 5.5 },
  { min: 23, max: 26, band: 5.0 },
  { min: 19, max: 22, band: 4.5 },
  { min: 15, max: 18, band: 4.0 },
  { min: 12, max: 14, band: 3.5 },
  { min: 9, max: 11, band: 3.0 },
  { min: 6, max: 8, band: 2.5 },
  { min: 4, max: 5, band: 2.0 },
  { min: 2, max: 3, band: 1.5 },
  { min: 1, max: 1, band: 1.0 },
  { min: 0, max: 0, band: 0.0 },
];

function lookupBand(table: BandRow[], correct: number): number {
  const c = Math.max(0, Math.round(correct));
  for (const row of table) {
    if (c >= row.min && c <= row.max) return row.band;
  }
  // Above the max defined row → return top band
  return table[0]?.band ?? 0;
}

/**
 * Scale a raw score to a 40-question equivalent before band lookup.
 * Most IELTS Listening/Reading sections have exactly 40 questions; if the
 * exam was authored with a different total we proportionally scale so the
 * standard table still applies.
 */
function scaleTo40(correct: number, total: number): number {
  if (total <= 0) return 0;
  if (total === 40) return correct;
  return Math.round((correct / total) * 40);
}

export function getIeltsListeningBand(correct: number, total = 40): number {
  return lookupBand(LISTENING_TABLE, scaleTo40(correct, total));
}

export function getIeltsReadingBand(
  correct: number,
  total = 40,
  readingType: IeltsReadingType = "ACADEMIC",
): number {
  const table = readingType === "GENERAL_TRAINING" ? READING_GENERAL_TABLE : READING_ACADEMIC_TABLE;
  return lookupBand(table, scaleTo40(correct, total));
}

/** Look up the IELTS band for a section by name + raw score. */
export function getIeltsBandForSection(
  sectionType: string,
  correct: number,
  total: number,
  opts: { readingType?: IeltsReadingType } = {},
): number | null {
  const t = String(sectionType || "").toUpperCase();
  if (t === "LISTENING") return getIeltsListeningBand(correct, total);
  if (t === "READING") return getIeltsReadingBand(correct, total, opts.readingType ?? "ACADEMIC");
  return null;
}

/**
 * Round a numeric band to the nearest valid IELTS overall band (.0 or .5).
 *
 * IELTS rounding rule: fractional part is rounded to nearest 0.5
 * - .25 → .5  (e.g. 6.25 → 6.5)
 * - .75 → 1.0 (e.g. 6.75 → 7.0)
 * - other halves stay (e.g. 6.1 → 6.0, 6.4 → 6.5)
 *
 * Specifically: round to nearest 0.25, then snap up to next 0.5 step.
 */
export function roundIeltsBand(value: number): number {
  if (!Number.isFinite(value)) return 0;
  // Standard British Council rule: average, then round to nearest half band.
  // Values ending in .25 round UP to .5, values ending in .75 round UP to next whole.
  const rounded = Math.round(value * 2) / 2;
  return Math.max(0, Math.min(9, rounded));
}

/**
 * Compute the IELTS overall band from per-section bands.
 * Averages the four section bands, then rounds per IELTS rules.
 * Returns null if no section bands are provided.
 */
export function computeIeltsOverallBand(bands: Array<number | null | undefined>): number | null {
  const valid = bands.filter((b): b is number => typeof b === "number" && Number.isFinite(b));
  if (valid.length === 0) return null;
  const avg = valid.reduce((sum, b) => sum + b, 0) / valid.length;
  return roundIeltsBand(avg);
}
