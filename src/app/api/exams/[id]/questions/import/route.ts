import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { z } from "zod";

const questionImportSchema = z.object({
  sectionType: z.enum(["READING", "LISTENING", "WRITING", "SPEAKING"]),
  qtype: z.string(),
  prompt: z.any(), // JSON
  options: z.any().optional(), // JSON
  answerKey: z.any().optional(), // JSON
  maxScore: z.number().int().min(1).optional().default(1),
  order: z.number().int().min(0),
});

const importSchema = z.object({
  items: z.array(questionImportSchema).min(1, "At least one question is required"),
});

// POST /api/exams/[id]/questions/import - Bulk import questions
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireTeacher();
    const body = await request.json();
    
    const validatedData = importSchema.parse(body);
    const examId = params.id;
    
    // Verify exam exists and user has permission
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        OR: [
          { createdById: (user as any).id },
          // Admins can import to any exam
          { createdBy: { role: "ADMIN" } }
        ]
      }
    });
    
    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found or you don't have permission" },
        { status: 404 }
      );
    }
    
    // Bulk create questions
    const questions = await prisma.question.createMany({
      data: validatedData.items.map(item => ({
        examId,
        sectionType: item.sectionType,
        qtype: item.qtype,
        prompt: item.prompt,
        options: item.options || null,
        answerKey: item.answerKey || null,
        maxScore: item.maxScore,
        order: item.order,
      })),
    });
    
    return NextResponse.json({
      message: `Successfully imported ${questions.count} questions`,
      count: questions.count
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message, details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.startsWith("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    console.error("Import questions error:", error);
    return NextResponse.json(
      { error: "An error occurred while importing questions" },
      { status: 500 }
    );
  }
}

