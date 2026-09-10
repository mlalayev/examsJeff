import {
  ENGLISH_LEVEL_IDS,
  ENGLISH_LEVELS,
  englishLevelLabel,
  englishLevelRank,
  isEnglishLevelId,
  type EnglishLevelId,
} from "@/lib/english-levels";

export type PlacementQuestionScore = {
  questionId: string;
  level: EnglishLevelId | null;
  correct: boolean;
  maxScore: number;
  earned: number;
};

export type PlacementLevelStats = {
  correct: number;
  total: number;
  earned: number;
  maxScore: number;
};

export type PlacementBreakdown = {
  strategy: "consecutive_level_mastery" | "overall_percent_fallback";
  overallPercent: number;
  totalCorrect: number;
  totalQuestions: number;
  byLevel: Partial<Record<EnglishLevelId, PlacementLevelStats>>;
  minAccuracy: number;
  level: EnglishLevelId;
};

/**
 * Minimum accuracy (0–1) required to “pass” a CEFR band that has questions.
 *
 * JEFF STAFF: change this single constant (or pass `minAccuracy` into
 * `determinePlacementLevel`) to adjust placement strictness. Do not copy
 * thresholds into React pages.
 */
export const PLACEMENT_DEFAULT_MIN_ACCURACY = 0.6;

/**
 * Used ONLY when a Placement Test has no questions tagged with a CEFR level.
 * Provisional until JEFF academic staff confirm the floors.
 *
 * Order matters: highest matching floor wins.
 */
export const PLACEMENT_OVERALL_PERCENT_FLOORS: Array<{
  minPercent: number;
  level: EnglishLevelId;
}> = [
  { minPercent: 0, level: "A1" },
  { minPercent: 25, level: "A2" },
  { minPercent: 45, level: "B1" },
  { minPercent: 65, level: "B1+" },
  { minPercent: 85, level: "B2" },
];

export { ENGLISH_LEVEL_IDS, ENGLISH_LEVELS, englishLevelLabel, isEnglishLevelId };

export function levelFromOverallPercent(
  percent: number,
  floors: typeof PLACEMENT_OVERALL_PERCENT_FLOORS = PLACEMENT_OVERALL_PERCENT_FLOORS
): EnglishLevelId {
  let result: EnglishLevelId = floors[0]?.level ?? "A1";
  for (const floor of floors) {
    if (percent >= floor.minPercent) result = floor.level;
  }
  return result;
}

/**
 * Authoritative Placement Level calculation (server-side only).
 *
 * Strategy A — consecutive_level_mastery (preferred):
 *   Questions are grouped by `cefrLevel`. Levels are walked A1→B2 among
 *   bands that appear in the attempt. The student keeps a band when
 *   accuracy ≥ minAccuracy; the first failed band stops advancement.
 *   Final level = last passed band. If the lowest tested band fails,
 *   result is still that band (cannot place below tested material).
 *
 * Strategy B — overall_percent_fallback:
 *   No questions have cefrLevel tags → map overall % via
 *   PLACEMENT_OVERALL_PERCENT_FLOORS.
 */
export function determinePlacementLevel(
  questions: PlacementQuestionScore[],
  options?: { minAccuracy?: number }
): PlacementBreakdown {
  const minAccuracy = options?.minAccuracy ?? PLACEMENT_DEFAULT_MIN_ACCURACY;

  const totalQuestions = questions.length;
  const totalCorrect = questions.filter((q) => q.correct).length;
  const overallPercent =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const byLevel: Partial<Record<EnglishLevelId, PlacementLevelStats>> = {};
  for (const q of questions) {
    if (!q.level) continue;
    const bucket = byLevel[q.level] ?? {
      correct: 0,
      total: 0,
      earned: 0,
      maxScore: 0,
    };
    bucket.total += 1;
    bucket.maxScore += q.maxScore;
    if (q.correct) {
      bucket.correct += 1;
      bucket.earned += q.earned;
    }
    byLevel[q.level] = bucket;
  }

  const testedLevels = ENGLISH_LEVEL_IDS.filter((id) => (byLevel[id]?.total ?? 0) > 0);

  if (testedLevels.length === 0) {
    const level = levelFromOverallPercent(overallPercent);
    return {
      strategy: "overall_percent_fallback",
      overallPercent,
      totalCorrect,
      totalQuestions,
      byLevel,
      minAccuracy,
      level,
    };
  }

  let result: EnglishLevelId = testedLevels[0];
  let passedAny = false;
  for (const id of testedLevels) {
    const stats = byLevel[id]!;
    const accuracy = stats.total > 0 ? stats.correct / stats.total : 0;
    if (accuracy >= minAccuracy) {
      result = id;
      passedAny = true;
    } else {
      // Stop at first failed band; keep last passed (or lowest tested if none passed)
      if (!passedAny) {
        result = id;
      }
      break;
    }
  }

  return {
    strategy: "consecutive_level_mastery",
    overallPercent,
    totalCorrect,
    totalQuestions,
    byLevel,
    minAccuracy,
    level: result,
  };
}

export function comparePlacementLevels(a: EnglishLevelId, b: EnglishLevelId): number {
  return englishLevelRank(a) - englishLevelRank(b);
}
