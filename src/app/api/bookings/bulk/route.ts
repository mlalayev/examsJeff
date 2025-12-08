import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrBoss, assertSameBranchOrBoss } from "@/lib/auth-utils";
import { z } from "zod";

const bulkBookingSchema = z.object({
  examId: z.string().min(1, "Exam ID is required"),
  classId: z.string().min(1, "Class ID is required"),
  studentIds: z.array(z.string()).min(1, "At least one student is required"),
  scheduledAt: z.string().datetime("Invalid date format"),
});

// Only ADMIN and BOSS can assign exams in bulk
export async function POST(request: Request) {
  try {
    const user = await requireAdminOrBoss();

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
    
    // Verify the class exists (for ADMIN/BOSS, no teacher ownership required)
    const classData = await prisma.class.findUnique({
      where: { id: validatedData.classId },
      include: {
        students: {
          where: {
            studentId: { in: validatedData.studentIds }
          }
        }
      }
    });
    
    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
    
    // Check branch access for all students
    const userBranchId = (user as any).branchId ?? null;
    const students = await prisma.user.findMany({
      where: { id: { in: validatedData.studentIds }, role: "STUDENT" },
      select: { id: true, branchId: true }
    });
    
    for (const student of students) {
      if (student.branchId) {
        assertSameBranchOrBoss(user, student.branchId);
      }
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
      validatedData.studentIds.map(studentId => {
        const student = students.find(s => s.id === studentId);
        return prisma.booking.create({
          data: {
            studentId,
            teacherId: null, // Admin-assigned exams don't need a teacher
            examId: validatedData.examId,
            sections: examSections,
            startAt,
            status: "CONFIRMED",
            branchId: userBranchId ?? student?.branchId ?? null,
          },
          include: {
            student: { select: { id: true, name: true, email: true } },
            exam: { select: { id: true, title: true } }
          }
        });
      })
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
