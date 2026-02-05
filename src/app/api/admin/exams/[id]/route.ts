import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { z } from "zod";

const questionSchema = z.object({
  id: z.string().optional(),
  qtype: z.enum(["MCQ", "ORDER", "DND_MATCH", "TF", "TF_NG", "MCQ_SINGLE", "MCQ_MULTI", "SELECT", "GAP", "ORDER_SENTENCE", "DND_GAP", "SHORT_TEXT", "ESSAY", "INLINE_SELECT", "FILL_IN_BLANK"]),
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
  image: z.string().nullable().optional(), // Section image (IELTS Listening parts)
  durationMin: z.number(),
  order: z.number(),
  questions: z.array(questionSchema),
});

const updateExamSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z.string().optional(),
  track: z.string().nullable().optional(),
  readingType: z.string().nullable().optional(),
  writingType: z.string().nullable().optional(),
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
      // Use transaction for better performance and atomicity
      const exam = await prisma.$transaction(async (tx) => {
        // Update exam basic fields first
        const updatedExam = await tx.exam.update({
          where: { id },
          data: {
            ...(validatedData.title ? { title: validatedData.title } : {}),
            ...(validatedData.category ? { category: validatedData.category as any } : {}),
            ...(validatedData.track !== undefined ? { track: validatedData.track } : {}),
            ...(validatedData.readingType !== undefined ? { readingType: validatedData.readingType } : {}),
            ...(validatedData.writingType !== undefined ? { writingType: validatedData.writingType } : {}),
            ...(validatedData.isActive !== undefined ? { isActive: validatedData.isActive } : {}),
          },
        });

        // Get existing sections with their IDs and questions (batch query)
        const existingSections = await tx.examSection.findMany({
          where: { examId: id },
          select: {
            id: true,
            questions: {
              select: { id: true },
            },
          },
        });
        const existingSectionIds = new Set(existingSections.map((s) => s.id));
        
        // Create a map of sectionId -> questionIds for faster lookup
        const sectionQuestionMap = new Map<string, Set<string>>();
        existingSections.forEach((s) => {
          sectionQuestionMap.set(
            s.id,
            new Set(s.questions.map((q) => q.id))
          );
        });

        // Get incoming section IDs (if any)
        const incomingSectionIds = new Set(
          validatedData.sections
            .map((s) => s.id)
            .filter((id): id is string => Boolean(id))
        );

        // Find sections to delete (exist in DB but not in incoming data)
        const sectionsToDelete = existingSections.filter(
          (s) => !incomingSectionIds.has(s.id)
        );

        // Delete orphaned sections (cascade will handle questions)
        if (sectionsToDelete.length > 0) {
          await tx.examSection.deleteMany({
            where: {
              id: { in: sectionsToDelete.map((s) => s.id) },
            },
          });
        }

        // Process each section (upsert pattern)
        const sectionPromises = validatedData.sections.map(async (section) => {
          const sectionData = {
            type: section.type,
            title: section.title,
            instruction: section.instruction || null,
            image: section.image || null, // Section image (IELTS Listening parts)
            durationMin: section.durationMin,
            order: section.order,
          };

          let sectionRecord;
          if (section.id && existingSectionIds.has(section.id)) {
            // Update existing section
            sectionRecord = await tx.examSection.update({
              where: { id: section.id },
              data: sectionData,
            });
          } else {
            // Create new section
            sectionRecord = await tx.examSection.create({
              data: {
                ...sectionData,
                examId: id,
              },
            });
          }

          // Get existing questions for this section (from pre-loaded map)
          const existingQuestionIds =
            sectionQuestionMap.get(sectionRecord.id) || new Set<string>();

          // Get incoming question IDs
          const incomingQuestionIds = new Set(
            section.questions
              .map((q) => q.id)
              .filter((id): id is string => Boolean(id))
          );

          // Delete orphaned questions (exist in DB but not in incoming data)
          const questionsToDelete = Array.from(existingQuestionIds).filter(
            (qId) => !incomingQuestionIds.has(qId)
          );
          if (questionsToDelete.length > 0) {
            await tx.question.deleteMany({
              where: {
                id: { in: questionsToDelete },
              },
            });
          }

          // Process each question (upsert pattern)
          const questionPromises = section.questions.map(async (q) => {
            const questionData = {
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
              sectionId: sectionRecord.id,
            };

            if (q.id && existingQuestionIds.has(q.id)) {
              // Update existing question
              return tx.question.update({
                where: { id: q.id },
                data: questionData,
              });
            } else {
              // Create new question
              return tx.question.create({
                data: questionData,
              });
            }
          });

          await Promise.all(questionPromises);
        });

        await Promise.all(sectionPromises);

        // Return updated exam with all relations
        return tx.exam.findUnique({
          where: { id },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            sections: {
              orderBy: { order: "asc" },
              include: {
                questions: {
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        });
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
    
    // Check if exam exists
    const exam = await prisma.exam.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        _count: {
          select: { 
            bookings: true,
            assignments: true 
          }
        }
      }
    });
    
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }
    
    // Delete exam (bookings and attempts will be cascade deleted)
    // Note: Bookings have onDelete: Cascade, so they will be automatically deleted
    await prisma.exam.delete({
      where: { id }
    });
    
    return NextResponse.json({ 
      message: "Exam deleted successfully",
      deletedBookings: exam._count.bookings,
      deletedAssignments: exam._count.assignments || 0
    });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    
    console.error("Admin delete exam error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
  }
}

