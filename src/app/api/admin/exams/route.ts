import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { z } from "zod";

const createExamSchema = z.object({
  title: z.string().min(1).max(200),
  examType: z.string().default("IELTS"),
  isActive: z.boolean().default(true),
});

// GET /api/admin/exams - List all exams
export async function GET() {
  try {
    await requireAdmin();
    
    const exams = await prisma.exam.findMany({
      orderBy: { createdAt: "desc" },
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
            sections: true,
            questions: true,
            bookings: true,
          }
        }
      }
    });
    
    return NextResponse.json({ exams });
    
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
        examType: validatedData.examType,
        isActive: validatedData.isActive,
        createdById: (user as any).id,
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

