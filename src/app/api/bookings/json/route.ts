import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { loadJsonExam } from "@/lib/json-exam-loader";
import { z } from "zod";

const createJsonBookingSchema = z.object({
  studentId: z.string().min(1),
  examId: z.string().min(1), // JSON exam ID
});

// POST /api/bookings/json - Create booking for JSON-based exam
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if ((user as any).role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can assign exams" }, { status: 403 });
    }
    
    const body = await request.json();
    const validatedData = createJsonBookingSchema.parse(body);
    
    // Verify student
    const student = await prisma.user.findUnique({
      where: { id: validatedData.studentId }
    });
    
    if (!student || student.role !== "STUDENT") {
      return NextResponse.json({ error: "Invalid student" }, { status: 400 });
    }
    
    // Load JSON exam to get sections
    const jsonExam = await loadJsonExam(validatedData.examId);
    
    if (!jsonExam || !jsonExam.sections || jsonExam.sections.length === 0) {
      return NextResponse.json(
        { error: "Exam not found or has no sections" },
        { status: 404 }
      );
    }
    
    // Get sections from JSON exam
    const examSections = jsonExam.sections.map((s: any) => s.type);
    
    // Use current time as startAt
    const startAt = new Date();
    
    // Ensure a stub exam record exists in DB for foreign key constraint
    let exam = await prisma.exam.findUnique({ where: { id: validatedData.examId } });
    if (!exam) {
      // Create stub exam record for JSON exam
      exam = await prisma.exam.create({
        data: {
          id: validatedData.examId,
          title: jsonExam.title || `JSON Exam: ${validatedData.examId}`,
          category: "GENERAL_ENGLISH",
          isActive: true,
        }
      });
    }
    
    const booking = await prisma.booking.create({
      data: {
        studentId: validatedData.studentId,
        teacherId: (user as any).id,
        examId: validatedData.examId,
        sections: examSections as any,
        startAt,
        status: "CONFIRMED",
        branchId: (user as any).branchId ?? null,
      },
      include: {
        student: { select: { id: true, name: true, email: true } }
      }
    });
    
    return NextResponse.json({
      message: "JSON exam assigned successfully",
      booking
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    
    console.error("Create JSON booking error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

