import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import { WordReviewStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  wordId: z.string().min(1),
  result: z.enum(["correct", "wrong"]),
});

/** Lightweight SM-2-style spacing intervals (days). */
const NEXT_INTERVAL_DAYS: Record<WordReviewStatus, number> = {
  NEW: 1,
  LEARNING: 2,
  REVIEW: 4,
  MASTERED: 14,
};

function nextStatusAfter(
  current: WordReviewStatus,
  result: "correct" | "wrong"
): WordReviewStatus {
  if (result === "wrong") {
    return current === "NEW" ? "NEW" : "LEARNING";
  }
  switch (current) {
    case "NEW":
      return "LEARNING";
    case "LEARNING":
      return "REVIEW";
    case "REVIEW":
      return "MASTERED";
    case "MASTERED":
      return "MASTERED";
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireStudent();
    const studentId = (user as any).id as string;
    const { id: wordListId } = await params;
    const body = bodySchema.parse(await request.json());

    // Verify the word belongs to the requested (published) list — prevents
    // students from posting reviews against arbitrary word ids.
    const word = await prisma.word.findFirst({
      where: {
        id: body.wordId,
        wordListId,
        wordList: { isPublished: true },
      },
      select: { id: true },
    });
    if (!word) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    const existing = await prisma.wordReview.findUnique({
      where: { wordId_studentId: { wordId: word.id, studentId } },
      select: { status: true, correctCount: true, wrongCount: true },
    });

    const currentStatus = existing?.status ?? WordReviewStatus.NEW;
    const newStatus = nextStatusAfter(currentStatus, body.result);
    const days = NEXT_INTERVAL_DAYS[newStatus];
    const nextReviewAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const now = new Date();

    const review = await prisma.wordReview.upsert({
      where: { wordId_studentId: { wordId: word.id, studentId } },
      update: {
        status: newStatus,
        nextReviewAt,
        lastReviewedAt: now,
        ...(body.result === "correct"
          ? { correctCount: { increment: 1 } }
          : { wrongCount: { increment: 1 } }),
      },
      create: {
        wordId: word.id,
        studentId,
        status: newStatus,
        nextReviewAt,
        lastReviewedAt: now,
        correctCount: body.result === "correct" ? 1 : 0,
        wrongCount: body.result === "wrong" ? 1 : 0,
      },
      select: {
        status: true,
        correctCount: true,
        wrongCount: true,
        nextReviewAt: true,
      },
    });

    return NextResponse.json({ review });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid body", issues: error.issues },
        { status: 400 }
      );
    }
    const status = /Unauthorized|Forbidden/.test(error?.message ?? "") ? 401 : 500;
    console.error("Word review error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to record review" },
      { status }
    );
  }
}
