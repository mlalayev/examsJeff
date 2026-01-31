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

    // Load exam data from database
    const exam = await prisma.exam.findUnique({ 
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
      }
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (!exam.sections || exam.sections.length === 0) {
      console.error('No sections found in exam:', { examId: attempt.examId, exam });
      return NextResponse.json({ error: "Exam has no sections" }, { status: 500 });
    }

    const parseInstruction = (instruction: any) => {
      if (!instruction) return { text: "", passage: null, audio: null, introduction: null };
      if (typeof instruction === "string") {
        try {
          const parsed = JSON.parse(instruction);
          if (parsed && typeof parsed === "object") {
            return parsed as Record<string, any>;
          }
          return { text: instruction, passage: null, audio: null, introduction: null };
        } catch {
          return { text: instruction, passage: null, audio: null, introduction: null };
        }
      }
      return instruction as Record<string, any>;
    };

    return NextResponse.json({
      id: attempt.id,
      examTitle: exam.title,
      examCategory: exam.category,
      status: attempt.status,
      sections: exam.sections.map((s: any) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        durationMin: s.durationMin,
        order: s.order,
        ...(() => {
          const instructionData = parseInstruction(s.instruction);
          return {
            instruction: instructionData?.text || "",
            passage: instructionData?.passage || null,
            audio: instructionData?.audio || null,
            introduction: instructionData?.introduction || null,
          };
        })(),
        image: s.image || null, // Section image (for IELTS Listening parts)
        questions: (s.questions || []).map((q: any) => ({
          ...q,
          prompt: q.prompt || {},
        })),
      })),
      savedAnswers: (attempt.answers as any) || {},
      sectionStartTimes: (attempt.answers as any)?.sectionStartTimes || {},
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
