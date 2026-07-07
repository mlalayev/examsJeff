import type { ExamCategory, PrismaClient } from "@prisma/client";

export const SUNDAY_EXAMINER_TAG = "SUNDAY_EXAMINER";

const DEFAULT_BRANCH_NAME = "Sunday Examiner";

/** Resolve the branch used for self-registered Sunday exam candidates. */
export async function resolveSundayExaminerBranchId(
  prisma: Pick<PrismaClient, "branch">
): Promise<string> {
  const envId = process.env.SUNDAY_EXAMINER_BRANCH_ID?.trim();
  if (envId) {
    const byId = await prisma.branch.findUnique({
      where: { id: envId },
      select: { id: true },
    });
    if (byId) return byId.id;
  }

  const branchName =
    process.env.SUNDAY_EXAMINER_BRANCH_NAME?.trim() || DEFAULT_BRANCH_NAME;

  const byName = await prisma.branch.findFirst({
    where: { name: { equals: branchName, mode: "insensitive" } },
    select: { id: true },
  });
  if (byName) return byName.id;

  const fuzzy = await prisma.branch.findFirst({
    where: {
      OR: [
        { name: { contains: "Sunday", mode: "insensitive" } },
        { name: { contains: "examiner", mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (fuzzy) return fuzzy.id;

  const fallback = await prisma.branch.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!fallback) {
    throw new Error("No branch configured for Sunday examiner registration");
  }

  return fallback.id;
}

/** First active non-homework exam for IELTS or SAT (oldest created). */
export async function findFirstExamForCategory(
  prisma: Pick<PrismaClient, "exam">,
  category: Extract<ExamCategory, "IELTS" | "SAT">
) {
  return prisma.exam.findFirst({
    where: {
      category,
      isActive: true,
      isHomework: false,
    },
    orderBy: { createdAt: "asc" },
    include: {
      sections: {
        select: { type: true },
        orderBy: { order: "asc" },
      },
    },
  });
}

export function studyTypesForExamCategory(
  category: Extract<ExamCategory, "IELTS" | "SAT">
): string[] {
  if (category === "IELTS") return ["IELTS"];
  return ["SAT_VERBAL", "SAT_MATH"];
}

export function isSundayExaminer(tags?: string[] | null): boolean {
  return Array.isArray(tags) && tags.includes(SUNDAY_EXAMINER_TAG);
}
