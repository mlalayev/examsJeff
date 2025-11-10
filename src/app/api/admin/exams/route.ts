import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireBranchAdminOrBoss } from "@/lib/auth-utils";
import { z } from "zod";

const questionSchema = z.object({
  qtype: z.enum(["MCQ", "ORDER", "DND_MATCH", "TF", "MCQ_SINGLE", "MCQ_MULTI", "SELECT", "GAP", "ORDER_SENTENCE", "DND_GAP", "SHORT_TEXT", "ESSAY", "INLINE_SELECT"]),
  order: z.number(),
  prompt: z.any(),
  options: z.any().optional(),
  answerKey: z.any(),
  maxScore: z.number().default(1),
  explanation: z.any().optional(),
  image: z.string().nullable().optional(),
});

const sectionSchema = z.object({
  type: z.enum(["READING", "LISTENING", "WRITING", "SPEAKING", "GRAMMAR", "VOCABULARY"]),
  title: z.string(),
  instruction: z.string(), // JSON string: {text, passage?, audio?}
  durationMin: z.number(),
  order: z.number(),
  questions: z.array(questionSchema),
});

const createExamSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum(["IELTS", "TOEFL", "SAT", "GENERAL_ENGLISH", "MATH", "KIDS"]),
  track: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  sections: z.array(sectionSchema).optional(),
});

// GET /api/admin/exams - List all exams
export async function GET(request: Request) {
  try {
    // Allow ADMIN, BOSS, BRANCH_ADMIN, and BRANCH_BOSS
    try {
      await requireAdmin();
    } catch {
      await requireBranchAdminOrBoss();
    }
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");
    
    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (isActive !== null) {
      where.isActive = isActive === "true";
    }
    
    const exams = await prisma.exam.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        sections: {
          include: {
            _count: {
              select: {
                questions: true
              }
            }
          }
        },
        _count: {
          select: {
            sections: true,
            bookings: true,
          }
        }
      }
    });
    
    // Calculate total questions for each exam
    const examsWithCounts = exams.map(exam => ({
      ...exam,
      _count: {
        ...exam._count,
        questions: exam.sections.reduce((sum, section) => sum + section._count.questions, 0)
      }
    }));
    
    return NextResponse.json({ exams: examsWithCounts });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    
    console.error("Admin get exams error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

// POST /api/admin/exams - Create exam
export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    
    const validatedData = createExamSchema.parse(body);
    
    const exam = await prisma.exam.create({
      data: {
        title: validatedData.title,
        category: validatedData.category,
        track: validatedData.track,
        isActive: validatedData.isActive ?? true,
        createdById: (user as any).id,
        sections: validatedData.sections ? {
          create: validatedData.sections.map((section) => {
            return {
              type: section.type,
              title: section.title,
              instruction: section.instruction || null, // Already JSON string from frontend
              durationMin: section.durationMin,
              order: section.order,
              questions: {
                create: section.questions.map((q) => ({
                  qtype: q.qtype,
                  order: q.order,
                  prompt: {
                    ...q.prompt,
                    // Add image to prompt if it exists
                    ...(q.image ? { image: q.image } : {}),
                  },
                  options: q.options,
                  answerKey: q.answerKey,
                  maxScore: q.maxScore,
                  explanation: q.explanation,
                })),
              },
            };
          }),
        } : undefined,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        sections: {
          include: {
            questions: true,
          },
        },
      }
    });
    
    return NextResponse.json({ exam }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    
    console.error("Admin create exam error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

