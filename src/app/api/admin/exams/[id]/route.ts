import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { z } from "zod";

const questionSchema = z.object({
  id: z.string().optional(),
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
  id: z.string().optional(),
  type: z.enum(["READING", "LISTENING", "WRITING", "SPEAKING", "GRAMMAR", "VOCABULARY"]),
  title: z.string(),
  instruction: z.string(),
  durationMin: z.number(),
  order: z.number(),
  questions: z.array(questionSchema),
});

const updateExamSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z.string().optional(),
  track: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sections: z.array(sectionSchema).optional(),
});

// GET /api/admin/exams/[id] - Get single exam
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAdmin();
    
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        sections: {
          orderBy: { order: "asc" },
          include: {
            questions: {
              orderBy: { order: "asc" }
            }
          }
        },
        _count: {
          select: {
            questions: true,
            bookings: true,
          }
        }
      }
    });
    
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }
    
    return NextResponse.json({ exam });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    
    console.error("Admin get exam error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/exams/[id] - Update exam
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    
    const validatedData = updateExamSchema.parse(body);
    
    // If sections are provided, we need to update them
    if (validatedData.sections) {
      // Delete all existing sections and questions (cascade will handle questions)
      await prisma.examSection.deleteMany({
        where: { examId: id }
      });
      
      // Create new sections with questions
      const exam = await prisma.exam.update({
        where: { id },
        data: {
          ...(validatedData.title ? { title: validatedData.title } : {}),
          ...(validatedData.category ? { category: validatedData.category as any } : {}),
          ...(validatedData.track !== undefined ? { track: validatedData.track } : {}),
          ...(validatedData.isActive !== undefined ? { isActive: validatedData.isActive } : {}),
          sections: {
            create: validatedData.sections.map((section) => ({
              type: section.type,
              title: section.title,
              instruction: section.instruction || null,
              durationMin: section.durationMin,
              order: section.order,
              questions: {
                create: section.questions.map((q) => ({
                  qtype: q.qtype,
                  order: q.order,
                  prompt: {
                    ...q.prompt,
                    ...(q.image ? { image: q.image } : {}),
                  },
                  options: q.options,
                  answerKey: q.answerKey,
                  maxScore: q.maxScore,
                  explanation: q.explanation,
                })),
              },
            })),
          },
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
      
      return NextResponse.json({ exam });
    } else {
      // Just update basic fields
      const exam = await prisma.exam.update({
        where: { id },
        data: {
          ...(validatedData.title ? { title: validatedData.title } : {}),
          ...(validatedData.category ? { category: validatedData.category as any } : {}),
          ...(validatedData.track !== undefined ? { track: validatedData.track } : {}),
          ...(validatedData.isActive !== undefined ? { isActive: validatedData.isActive } : {}),
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });
      
      return NextResponse.json({ exam });
    }
    
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
    
    console.error("Admin update exam error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/exams/[id] - Delete exam
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    
    // Check if exam has bookings
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });
    
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }
    
    if (exam._count.bookings > 0) {
      return NextResponse.json(
        { error: `Cannot delete exam with ${exam._count.bookings} booking(s). Set inactive instead.` },
        { status: 400 }
      );
    }
    
    await prisma.exam.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: "Exam deleted successfully" });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    
    console.error("Admin delete exam error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

