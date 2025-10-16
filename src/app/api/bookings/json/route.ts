import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { z } from "zod";

const createJsonBookingSchema = z.object({
  studentId: z.string().min(1),
  examId: z.string().min(1), // JSON exam ID
  sections: z.array(z.string()).min(1),
  startAt: z.string().datetime(),
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
    
    const startAt = new Date(validatedData.startAt);
    
    // Verify student
    const student = await prisma.user.findUnique({
      where: { id: validatedData.studentId }
    });
    
    if (!student || student.role !== "STUDENT") {
      return NextResponse.json({ error: "Invalid student" }, { status: 400 });
    }
    
    // Check for conflicts (within 1 minute)
    const windowMs = 1 * 60 * 1000;
    const windowBefore = new Date(startAt.getTime() - windowMs);
    const windowAfter = new Date(startAt.getTime() + windowMs);
    
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        studentId: validatedData.studentId,
        startAt: {
          gte: windowBefore,
          lte: windowAfter,
        },
        status: {
          in: ["CONFIRMED", "IN_PROGRESS"]
        }
      }
    });
    
    if (conflictingBooking) {
      return NextResponse.json(
        { error: "Student already has a booking near this time" },
        { status: 409 }
      );
    }
    
    // Ensure a stub exam record exists in DB for foreign key constraint
    let exam = await prisma.exam.findUnique({ where: { id: validatedData.examId } });
    if (!exam) {
      // Create stub exam record for JSON exam
      exam = await prisma.exam.create({
        data: {
          id: validatedData.examId,
          title: `JSON Exam: ${validatedData.examId}`,
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
        sections: validatedData.sections as any,
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

