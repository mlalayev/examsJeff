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
 * Adjust here — do not copy thresholds into UI files.
 */
export const PLACEMENT_DEFAULT_MIN_ACCURACY = 0.6;

/**
 * Used ONLY when a Placement Test has no questions tagged with a CEFR level.
 * These floors are provisional until JEFF academic staff confirm them.
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
  for (const id of testedLevels) {
    const stats = byLevel[id]!;
    const accuracy = stats.total > 0 ? stats.correct / stats.total : 0;
    if (accuracy >= minAccuracy) {
      result = id;
    } else {
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
