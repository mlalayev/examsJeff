import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { z } from "zod";

const sectionSchema = z.object({
  type: z.enum(["READING", "LISTENING", "WRITING", "SPEAKING"]),
  durationMin: z.number().int().min(1).max(300),
  order: z.number().int().min(0),
});

const createExamSchema = z.object({
  title: z.string().min(1, "Exam title is required").max(200, "Title is too long"),
  examType: z.string().optional().default("IELTS"),
  isActive: z.boolean().optional().default(true),
  sections: z.array(sectionSchema).optional().default([]),
});

// POST /api/exams - Create a new exam with sections
export async function POST(request: Request) {
  try {
    const user = await requireTeacher();
    const body = await request.json();
    
    const validatedData = createExamSchema.parse(body);
    
    const exam = await prisma.exam.create({
      data: {
        title: validatedData.title,
        examType: validatedData.examType,
        isActive: validatedData.isActive,
        createdById: (user as any).id,
        sections: {
          create: validatedData.sections.map(section => ({
            type: section.type,
            durationMin: section.durationMin,
            order: section.order,
          }))
        }
      },
      include: {
        sections: true,
      }
    });
    
    return NextResponse.json({
      message: "Exam created successfully",
      exam
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
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
    
    console.error("Create exam error:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the exam" },
      { status: 500 }
    );
  }
}

// GET /api/exams - List all exams
export async function GET() {
  try {
    await requireTeacher();
    
    const exams = await prisma.exam.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: { 
            bookings: true,
            sections: true,
            questions: true
          }
        }
      }
    });
    
    return NextResponse.json({ exams });
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.startsWith("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    console.error("List exams error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching exams" },
      { status: 500 }
    );
  }
}

