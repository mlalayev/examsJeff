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
                image: true, // Include image for FILL_IN_BLANK questions
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

    // Debug log to check if images are in the data
    console.log('📸 Exam questions with images:', JSON.stringify(exam.sections.map(s => ({
      section: s.type,
      questions: s.questions.map((q: any) => ({
        id: q.id,
        qtype: q.qtype,
        order: q.order,
        hasImage: !!q.image,
        image: q.image,
        promptKeys: Object.keys(q.prompt || {}),
        hasPrompt: !!q.prompt,
      }))
    })), null, 2));

    const responseData = {
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
        questions: (s.questions || []).map((q: any) => {
          const prompt = q.prompt || {};
          return {
          ...q,
            prompt: {
              ...prompt,
              // Map top-level image to prompt.imageUrl for question components
              imageUrl: q.image || prompt.imageUrl || null,
            },
          };
        }),
      })),
      savedAnswers: await (async () => {
        // Prefer normalized per-question rows when present (but table may not exist yet)
        try {
          const rows = await prisma.attemptAnswer.findMany({
            where: { attemptId },
            select: { section: true, questionId: true, answer: true },
          });
          if (rows.length > 0) {
            const bySection: Record<string, Record<string, any>> = {};
            for (const row of rows as any[]) {
              const sectionKey = String(row.section);
              bySection[sectionKey] = bySection[sectionKey] || {};
              bySection[sectionKey][row.questionId] = row.answer;
            }
            return bySection;
          }
        } catch (e) {
          // Migration might not be applied yet in some environments
          console.warn("AttemptAnswer table not available; falling back to legacy storage.");
        }

        // Legacy: JSON exams store answers in attempt.answers; DB exams store in attempt.sections.answers
        const isJsonExam = attempt.sections.length === 0;
        if (isJsonExam) return (attempt.answers as any) || {};

        const bySection: Record<string, Record<string, any>> = {};
        for (const s of attempt.sections as any[]) {
          if (!s?.type) continue;
          bySection[String(s.type)] = (s.answers as any) || {};
        }
        return bySection;
      })(),
      sectionStartTimes: (attempt.answers as any)?.sectionStartTimes || {},
    };

    // Log the mapped questions to verify structure
    console.log('🔍 Mapped questions:', JSON.stringify({
      totalSections: responseData.sections.length,
      sectionsWithQuestions: responseData.sections.filter(s => s.questions.length > 0).map(s => ({
        type: s.type,
        questionCount: s.questions.length,
        firstQuestion: s.questions[0] ? {
          id: s.questions[0].id,
          qtype: s.questions[0].qtype,
          hasPrompt: !!s.questions[0].prompt,
          promptKeys: Object.keys(s.questions[0].prompt || {}),
        } : null
      }))
    }, null, 2));

    return NextResponse.json(responseData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isForbidden = message.toLowerCase().includes("forbidden") || message.toLowerCase().includes("unauthorized");
    if (isForbidden) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    console.error("Load attempt error:", error);
    console.error("Error details:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ 
      error: "Failed to load attempt", 
      details: message 
    }, { status: 500 });
  }
}
