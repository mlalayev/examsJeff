import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import { SectionType, QuestionType } from "@prisma/client";
import { scoreQuestion } from "@/lib/scoring";

type AnswersByQuestionId = Record<string, any>;

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const user = await requireStudent();
    const { attemptId } = await params;
    const studentId = (user as any).id as string;

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        sections: true,
      },
    });
    if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    if (attempt.studentId !== studentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Load exam with sections/questions to evaluate
    const exam = await prisma.exam.findUnique({
      where: { id: attempt.examId },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            questions: {
              orderBy: { order: "asc" },
              select: { id: true, qtype: true, prompt: true, options: true, answerKey: true, maxScore: true, order: true },
            },
          },
        },
      },
    });
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    // Map attempt section answers by section type
    const answersByType: Record<string, AnswersByQuestionId> = {};
    for (const as of attempt.sections) {
      if (as.answers) answersByType[as.type as string] = as.answers as AnswersByQuestionId;
    }

    let totalRaw = 0;
    let totalMax = 0;

    const updates: Array<Promise<any>> = [];

    for (const section of exam.sections) {
      const sectionType = section.type as SectionType;
      const isWriting = sectionType === "WRITING";

      let sectionRaw = 0;
      let sectionMax = 0;

      // For writing, don't auto-score; calculate maxScore but keep raw null
      if (!isWriting) {
        for (const q of section.questions) {
          const qtype = q.qtype as QuestionType;
          // Only auto types
          const auto = qtype !== "SHORT_TEXT" && qtype !== "ESSAY";
          if (!auto) continue;

          const answer = (answersByType[sectionType] || {})[q.id];
          const correct = scoreQuestion(qtype, answer, q.answerKey);
          // Each question's maxScore may be >1; scale with correct (0/1)
          if (typeof q.maxScore === "number") {
            sectionRaw += correct ? q.maxScore : 0;
            sectionMax += q.maxScore;
          } else {
            sectionRaw += correct;
            sectionMax += 1;
          }
        }
        totalRaw += sectionRaw;
        totalMax += sectionMax;
      } else {
        // still compute maxScore for writing to show denominator across writing if needed
        for (const q of section.questions) {
          if (typeof q.maxScore === "number") sectionMax += q.maxScore;
          else sectionMax += 1;
        }
      }

      updates.push(
        prisma.attemptSection.updateMany({
          where: { attemptId, type: sectionType },
          data: {
            rawScore: isWriting ? null : sectionRaw,
            maxScore: sectionMax || null,
            status: "COMPLETED",
          },
        })
      );
    }

    await Promise.all(updates);

    const overallPercent = totalMax > 0 ? (totalRaw / totalMax) * 100 : null;

    await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        bandOverall: overallPercent ?? undefined,
      },
    });

    return NextResponse.json({ success: true, attemptId, resultsUrl: `/attempt/${attemptId}/results` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isForbidden = message.toLowerCase().includes("forbidden") || message.toLowerCase().includes("unauthorized");
    if (isForbidden) return NextResponse.json({ error: message }, { status: 403 });
    console.error("Submit attempt error:", error);
    return NextResponse.json({ error: "Failed to submit attempt" }, { status: 500 });
  }
}

