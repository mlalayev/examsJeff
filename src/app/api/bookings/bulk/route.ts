import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { z } from "zod";

const bulkBookingSchema = z.object({
  examId: z.string().min(1, "Exam ID is required"),
  classId: z.string().min(1, "Class ID is required"),
  studentIds: z.array(z.string()).min(1, "At least one student is required"),
  scheduledAt: z.string().datetime("Invalid date format"),
});

export async function POST(request: Request) {
  try {
    const user = await requireTeacher();
    if ((user as any).role === "TEACHER" && !(user as any).approved) {
      return NextResponse.json({ error: "Approval required" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = bulkBookingSchema.parse(body);
    
    const startAt = new Date(validatedData.scheduledAt);
    
    // Verify the exam exists and get its sections
    const exam = await prisma.exam.findUnique({
      where: { id: validatedData.examId },
      include: {
        sections: {
          select: { type: true },
          orderBy: { order: "asc" }
        }
      }
    });
    
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }
    
    if (!exam.isActive) {
      return NextResponse.json({ error: "Exam is not active" }, { status: 400 });
    }
    
    // Get all sections from the exam
    const examSections = exam.sections.map(s => s.type);
    
    // Verify the class exists and teacher has access
    const classData = await prisma.class.findFirst({
      where: {
        id: validatedData.classId,
        teacherId: (user as any).id,
      },
      include: {
        students: {
          where: {
            studentId: { in: validatedData.studentIds }
          }
        }
      }
    });
    
    if (!classData) {
      return NextResponse.json({ error: "Class not found or access denied" }, { status: 404 });
    }
    
    // Check for conflicts for each student
    const windowMs = 1 * 60 * 1000; // 1 minute
    const windowBefore = new Date(startAt.getTime() - windowMs);
    const windowAfter = new Date(startAt.getTime() + windowMs);
    
    const conflicts = await prisma.booking.findMany({
      where: {
        studentId: { in: validatedData.studentIds },
        startAt: {
          gte: windowBefore,
          lte: windowAfter,
        },
        status: {
          in: ["CONFIRMED", "IN_PROGRESS"]
        }
      },
      include: {
        student: { select: { name: true, email: true } }
      }
    });
    
    if (conflicts.length > 0) {
      const conflictDetails = conflicts.map(c => ({
        student: c.student.name || c.student.email,
        startAt: c.startAt,
        status: c.status,
      }));
      
      return NextResponse.json({
        error: "Some students have conflicting bookings",
        conflicts: conflictDetails
      }, { status: 409 });
    }
    
    // Create bookings for all students
    const bookings = await Promise.all(
      validatedData.studentIds.map(studentId =>
        prisma.booking.create({
          data: {
            studentId,
            teacherId: (user as any).id,
            examId: validatedData.examId,
            sections: examSections,
            startAt,
            status: "CONFIRMED",
            branchId: (user as any).branchId ?? null,
          },
          include: {
            student: { select: { id: true, name: true, email: true } },
            exam: { select: { id: true, title: true } }
          }
        })
      )
    );
    
    return NextResponse.json({
      success: true,
      message: `Exam assigned to ${bookings.length} student(s)`,
      bookings: bookings.map(b => ({
        id: b.id,
        student: b.student,
        exam: b.exam,
        startAt: b.startAt,
      }))
    });
    
  } catch (error) {
    console.error("Bulk booking error:", error);
    return NextResponse.json(
      { error: "Failed to assign exam", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
