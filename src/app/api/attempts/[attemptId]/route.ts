import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import { loadJsonExam } from "@/lib/json-exam-loader";

export async function GET(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
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

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }
    if (attempt.studentId !== studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Try loading from JSON first, then fall back to DB
    let exam: any = null;
    
    // Check if this is a JSON exam (stub with no sections in DB)
    const dbExam = await prisma.exam.findUnique({ 
      where: { id: attempt.examId },
      include: { sections: true }
    });
    
    console.log('Loading exam:', { attemptId, examId: attempt.examId, hasDbExam: !!dbExam, dbSectionsCount: dbExam?.sections?.length });
    
    if (!dbExam || !dbExam.sections || dbExam.sections.length === 0) {
      // Try loading from JSON (either no DB exam or it's a stub with no sections)
      exam = await loadJsonExam(attempt.examId);
      console.log('Loaded from JSON:', { examId: exam?.id, sectionsCount: exam?.sections?.length });
    } else {
      // Load from DB with full details
      exam = await prisma.exam.findUnique({
        where: { id: attempt.examId },
        include: {
          sections: {
            orderBy: { order: "asc" },
            include: {
              questions: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  qtype: true,
                  prompt: true,
                  options: true,
                  maxScore: true,
                  order: true,
                },
              },
            },
          },
        },
      });
    }

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
      },
      exam: {
        id: exam.id,
        title: exam.title,
        category: exam.category,
        track: exam.track,
        sections: exam.sections.map((s) => ({
          id: s.id,
          type: s.type,
          title: s.title,
          durationMin: s.durationMin,
          order: s.order,
          questions: s.questions,
        })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isForbidden = message.toLowerCase().includes("forbidden") || message.toLowerCase().includes("unauthorized");
    if (isForbidden) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    console.error("Load attempt error:", error);
    return NextResponse.json({ error: "Failed to load attempt" }, { status: 500 });
  }
}
