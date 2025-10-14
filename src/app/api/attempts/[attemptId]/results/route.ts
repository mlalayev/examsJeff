import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

export async function GET(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const user = await requireStudent();
    const { attemptId } = await params;
    const studentId = (user as any).id as string;

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { sections: true },
    });
    if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    if (attempt.studentId !== studentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const exam = await prisma.exam.findUnique({
      where: { id: attempt.examId },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            questions: {
              orderBy: { order: "asc" },
              select: { id: true, qtype: true, prompt: true, options: true, answerKey: true, explanation: true, maxScore: true, order: true },
            },
          },
        },
      },
    });
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    // Map answers by section type for quick lookup
    const answersByType: Record<string, Record<string, any>> = {};
    for (const s of attempt.sections) {
      if (s.answers) answersByType[s.type as string] = s.answers as Record<string, any>;
    }

    const response = {
      attempt: {
        id: attempt.id,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
        bandOverall: attempt.bandOverall,
      },
      exam: {
        id: exam.id,
        title: exam.title,
        category: exam.category,
        track: exam.track,
      },
      sections: exam.sections.map((sec) => {
        const as = attempt.sections.find((x) => x.type === sec.type);
        const sectionPercent = as?.rawScore != null && as?.maxScore != null && as.maxScore > 0
          ? Math.round((as.rawScore / as.maxScore) * 100)
          : null;
        return {
          id: sec.id,
          type: sec.type,
          title: sec.title,
          rawScore: as?.rawScore ?? null,
          maxScore: as?.maxScore ?? null,
          percent: sectionPercent,
          questions: sec.questions.map((q) => {
            const your = (answersByType[sec.type] || {})[q.id];
            return {
              id: q.id,
              order: q.order,
              qtype: q.qtype,
              prompt: q.prompt,
              options: q.options,
              yourAnswer: your ?? null,
              correctAnswer: q.answerKey ?? null,
              explanation: q.explanation ?? null,
              maxScore: q.maxScore,
            };
          }),
        };
      }),
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isForbidden = message.toLowerCase().includes("forbidden") || message.toLowerCase().includes("unauthorized");
    if (isForbidden) return NextResponse.json({ error: message }, { status: 403 });
    console.error("Get results error:", error);
    return NextResponse.json({ error: "Failed to load results" }, { status: 500 });
  }
}
