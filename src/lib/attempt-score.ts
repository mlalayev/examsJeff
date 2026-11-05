import { Prisma, SectionType } from "@prisma/client";

export type AttemptSectionScoreInput = {
  type: SectionType | string;
  rubric?: unknown;
  rawScore: number | null;
  maxScore: number | null;
};

/**
 * Percent score from auto-graded sections (WRITING excluded).
 * Matches student/teacher attempt history APIs.
 */
export function computeAttemptPercentFromSections(
  sections: AttemptSectionScoreInput[]
): number | null {
  const grading = sections.map(s => s.rubric as { generalWritingStatus?: string; generalOverall?: number | null } | null).find(r => r?.generalWritingStatus);
  if (grading) return grading.generalWritingStatus === 'COMPLETED' ? grading.generalOverall ?? null : null;
  const autoSections = sections.filter((s) => s.type !== SectionType.WRITING);
  const totalRaw = autoSections.reduce((acc, s) => acc + (s.rawScore ?? 0), 0);
  const totalMax = autoSections.reduce((acc, s) => acc + (s.maxScore ?? 0), 0);

  if (totalMax <= 0) {
    return null;
  }

  return Math.round((totalRaw / totalMax) * 100);
}

type PrismaTx = Prisma.TransactionClient;

export async function loadAttemptPercent(
  attemptId: string,
  client: PrismaTx | typeof import("@/lib/prisma").prisma
): Promise<number | null> {
  const attempt = await client.attempt.findUnique({
    where: { id: attemptId },
    select: {
      sections: {
        select: { type: true, rawScore: true, maxScore: true, rubric: true },
      },
    },
  });

  if (!attempt) {
    return null;
  }

  return computeAttemptPercentFromSections(attempt.sections);
}
