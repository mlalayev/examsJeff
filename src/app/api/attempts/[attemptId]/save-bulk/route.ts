import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import { applyRateLimit } from "@/lib/rate-limiter-enhanced";
import { validateBodySize } from "@/lib/security";
import { SectionType } from "@prisma/client";

type BulkPayload = {
  // For runner: answers are keyed by sectionId in UI, but server needs sectionType
  sections?: Array<{
    sectionType: string;
    answers: Record<string, any>;
  }>;
  sectionStartTimes?: Record<string, number>;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const rateLimitResult = await applyRateLimit(request as any, "API");
    if (rateLimitResult) return rateLimitResult;

    const user = await requireStudent();
    const { attemptId } = await params;
    const studentId = (user as any).id as string;
    const body = (await request.json()) as BulkPayload;

    const sizeValidation = validateBodySize(body, 4 * 1024 * 1024); // 4MB max for bulk sync
    if (!sizeValidation.valid) {
      return NextResponse.json({ error: sizeValidation.error }, { status: 400 });
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { sections: true },
    });

    if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    if (attempt.studentId !== studentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const isJsonExam = attempt.sections.length === 0;
    const sections = Array.isArray(body.sections) ? body.sections : [];

    if (isJsonExam) {
      const currentAnswers = (attempt.answers as any) || {};
      let updatedAnswers = { ...currentAnswers };

      for (const s of sections) {
        if (!s?.sectionType || !s?.answers) continue;
        updatedAnswers = {
          ...updatedAnswers,
          [s.sectionType]: {
            ...(currentAnswers[s.sectionType] || {}),
            ...s.answers,
          },
        };

        // best-effort normalized rows
        try {
          const sectionEnum = s.sectionType as SectionType;
          const entries = Object.entries(s.answers || {});
          await prisma.$transaction(
            entries.map(([questionId, answer]) =>
              prisma.attemptAnswer.upsert({
                where: {
                  attemptId_section_questionId: { attemptId, section: sectionEnum, questionId },
                },
                create: { attemptId, section: sectionEnum, questionId, answer: answer ?? null },
                update: { answer: answer ?? null },
              })
            )
          );
        } catch {
          // ignore (migration may not exist yet)
        }
      }

      if (body.sectionStartTimes) {
        updatedAnswers = {
          ...updatedAnswers,
          sectionStartTimes: {
            ...(currentAnswers.sectionStartTimes || {}),
            ...body.sectionStartTimes,
          },
        };
      }

      await prisma.attempt.update({
        where: { id: attemptId },
        data: { answers: updatedAnswers },
      });

      return NextResponse.json({ success: true });
    }

    // DB exam: update each attemptSection by type
    await prisma.$transaction(async (tx) => {
      for (const s of sections) {
        if (!s?.sectionType || !s?.answers) continue;

        await tx.attemptSection.updateMany({
          where: { attemptId, type: s.sectionType as any },
          data: { answers: s.answers },
        });

        // best-effort normalized rows
        try {
          const sectionEnum = s.sectionType as SectionType;
          const entries = Object.entries(s.answers || {});
          await tx.$transaction(
            entries.map(([questionId, answer]) =>
              tx.attemptAnswer.upsert({
                where: {
                  attemptId_section_questionId: { attemptId, section: sectionEnum, questionId },
                },
                create: { attemptId, section: sectionEnum, questionId, answer: answer ?? null },
                update: { answer: answer ?? null },
              })
            )
          );
        } catch {
          // ignore (migration may not exist yet)
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to bulk save: ${message}` }, { status: 500 });
  }
}

