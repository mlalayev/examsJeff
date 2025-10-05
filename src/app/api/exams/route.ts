import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { z } from "zod";

const createExamSchema = z.object({
  title: z.string().min(1, "Exam title is required").max(200, "Title is too long"),
  isActive: z.boolean().optional().default(true),
});

// POST /api/exams - Create a new exam
export async function POST(request: Request) {
  try {
    const user = await requireTeacher();
    const body = await request.json();
    
    const validatedData = createExamSchema.parse(body);
    
    const exam = await prisma.exam.create({
      data: {
        title: validatedData.title,
        isActive: validatedData.isActive,
        createdById: (user as any).id,
      },
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
          select: { bookings: true }
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

