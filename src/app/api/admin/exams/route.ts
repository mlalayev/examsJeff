import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireBranchAdminOrBoss } from "@/lib/auth-utils";
import { z } from "zod";
import { validateIELTSListeningUniqueness, sortIELTSSections } from "@/components/admin/exams/create/constants";

const questionSchema = z.object({
  qtype: z.enum(["MCQ", "ORDER", "DND_MATCH", "TF", "TF_NG", "MCQ_SINGLE", "MCQ_MULTI", "SELECT", "GAP", "ORDER_SENTENCE", "DND_GAP", "SHORT_TEXT", "ESSAY", "INLINE_SELECT", "FILL_IN_BLANK", "SPEAKING_RECORDING"]),
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
  instruction: z.string(), // JSON string: {text, passage?, audio?, introduction?, image?, image2?}
  image: z.string().nullable().optional(), // Section image (for IELTS Listening parts)
  image2: z.string().nullable().optional(), // Second section image (for IELTS Listening parts)
  parentSectionId: z.string().nullable().optional(), // For subsections (IELTS Listening)
  parentTitle: z.string().nullable().optional(), // Temporary reference to find parent
  parentOrder: z.number().nullable().optional(), // Temporary reference to find parent
  durationMin: z.number(),
  order: z.number(),
  // Allow creating sections with zero questions (optional question list)
  questions: z.array(questionSchema).optional(),
});

const createExamSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum(["IELTS", "TOEFL", "SAT", "GENERAL_ENGLISH", "MATH", "KIDS"]),
  track: z.string().nullable().optional(),
  readingType: z.string().nullable().optional(), // IELTS Reading type: ACADEMIC or GENERAL
  writingType: z.string().nullable().optional(), // IELTS Writing type: ACADEMIC or GENERAL
  durationMin: z.number().nullable().optional(), // Optional exam timer
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
    
    // Optimized: use select instead of include, limit to 100 exams
    const exams = await prisma.exam.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to 100 most recent exams
      select: {
        id: true,
        title: true,
        category: true,
        track: true,
        isActive: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        sections: {
          select: {
            id: true,
            type: true,
            title: true,
            order: true,
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
    
    console.log("=== CREATE EXAM REQUEST ===");
    console.log("Category:", body.category);
    console.log("Sections count:", body.sections?.length || 0);
    console.log("First section:", JSON.stringify(body.sections?.[0], null, 2));
    
    const validatedData = createExamSchema.parse(body);
    
    // IELTS validation: Check LISTENING uniqueness
    if (validatedData.category === "IELTS" && validatedData.sections) {
      const validation = validateIELTSListeningUniqueness(validatedData.sections);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
      
      // Sort IELTS sections in correct order
      validatedData.sections = sortIELTSSections(validatedData.sections);
    }
    
    // Separate parent sections from subsections
    const subsections = validatedData.sections?.filter(s => s.parentTitle) || [];
    const regularSections = validatedData.sections?.filter(s => !s.parentTitle) || [];
    
    console.log("Regular sections:", regularSections.length);
    console.log("Subsections:", subsections.length);
    
    // Create exam with regular sections first
    const exam = await prisma.exam.create({
      data: {
        title: validatedData.title,
        category: validatedData.category,
        track: validatedData.track,
        readingType: validatedData.readingType,
        writingType: validatedData.writingType,
        durationMin: validatedData.durationMin,
        isActive: validatedData.isActive ?? true,
        createdById: (user as any).id,
        sections: {
          create: regularSections.map((section) => {
              console.log("Creating section:", section.title, "order:", section.order, "type:", typeof section.order);
              return {
              type: section.type,
              title: section.title,
              instruction: section.instruction || null, // Already JSON string from frontend
              image: section.image || null, // Section image (for IELTS Listening parts)
              image2: section.image2 || null, // Second section image (for IELTS Listening parts)
              durationMin: section.durationMin,
              order: Number(section.order), // Ensure it's a number
              questions: {
                create: (section.questions || []).map((q) => ({
                  qtype: q.qtype,
                  order: q.order,
                  prompt: {
                    ...q.prompt,
                    // Add imageUrl to prompt if image exists
                    ...(q.image ? { imageUrl: q.image } : {}),
                  },
                  options: q.options,
                  answerKey: q.answerKey,
                  maxScore: q.maxScore,
                  explanation: q.explanation,
                })),
              },
            };
          }),
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
    
    // Now create subsections with parentSectionId
    if (subsections.length > 0) {
      // Group subsections by parent (parentTitle + parentOrder)
      const subsectionsByParent = new Map<string, typeof subsections>();
      for (const subsection of subsections) {
        const key = `${subsection.parentTitle}-${subsection.parentOrder}`;
        if (!subsectionsByParent.has(key)) {
          subsectionsByParent.set(key, []);
        }
        subsectionsByParent.get(key)!.push(subsection);
      }
      
      // For each parent group, create parent section first, then subsections
      for (const [key, subs] of subsectionsByParent.entries()) {
        const firstSub = subs[0];
        
        // Create parent section (empty, just for grouping)
        const parentSection = await prisma.examSection.create({
          data: {
            examId: exam.id,
            type: firstSub.type,
            title: firstSub.parentTitle || "Listening",
            instruction: firstSub.instruction || "{}",
            durationMin: firstSub.durationMin,
            order: firstSub.parentOrder || 0,
          },
        });
        
        // Create subsections under this parent
        for (const subsection of subs) {
          await prisma.examSection.create({
            data: {
              examId: exam.id,
              type: subsection.type,
              title: subsection.title,
              instruction: subsection.instruction || null,
              image: subsection.image || null,
              image2: subsection.image2 || null,
              parentSectionId: parentSection.id,
              durationMin: subsection.durationMin,
              order: subsection.order,
              questions: {
                create: subsection.questions?.map((q) => ({
                  qtype: q.qtype,
                  order: q.order,
                  prompt: {
                    ...q.prompt,
                    ...(q.image ? { imageUrl: q.image } : {}),
                  },
                  options: q.options,
                  answerKey: q.answerKey,
                  maxScore: q.maxScore,
                  explanation: q.explanation,
                })) || [],
              },
            },
          });
        }
      }
      
      // Reload exam with all sections
      const updatedExam = await prisma.exam.findUnique({
        where: { id: exam.id },
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
        },
      });
      
      return NextResponse.json({ exam: updatedExam }, { status: 201 });
    }
    
    return NextResponse.json({ exam }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", JSON.stringify(error.errors, null, 2));
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    
    console.error("Admin create exam error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Error details:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "An error occurred", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

