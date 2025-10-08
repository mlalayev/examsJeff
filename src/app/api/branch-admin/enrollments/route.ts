import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBranchAdmin, getScopedBranchId } from "@/lib/auth-utils";
import { z } from "zod";

const createEnrollmentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  courseName: z.string().min(1, "Course name is required"),
  courseType: z.enum(["IELTS", "GENERAL_ENGLISH", "TOEFL", "OTHER"]),
  level: z.string().optional(),
  notes: z.string().optional(),
  monthlyAmount: z.number().positive("Monthly amount must be positive"),
  startDate: z.string().optional(), // Will be converted to Date if provided
});

// GET /api/branch-admin/enrollments - List enrollments
export async function GET(request: Request) {
  try {
    const user = await requireBranchAdmin();
    const branchId = getScopedBranchId(user);
    
    const branchFilter = branchId ? { branchId } : {};

    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        ...branchFilter,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        paymentSchedules: {
          orderBy: { dueDate: "asc" },
          take: 1, // Get next payment
        },
        _count: {
          select: {
            paymentSchedules: true,
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    return NextResponse.json({ enrollments });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Branch admin enrollments error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

// POST /api/branch-admin/enrollments - Create new enrollment
export async function POST(request: Request) {
  try {
    const user = await requireBranchAdmin();
    const branchId = getScopedBranchId(user);
    const body = await request.json();
    const validatedData = createEnrollmentSchema.parse(body);

    // Verify student exists and is in the same branch
    const student = await prisma.user.findUnique({
      where: { id: validatedData.studentId },
      select: { id: true, role: true, branchId: true },
    });

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Enforce branch scoping (only for BRANCH_ADMIN, BOSS can enroll anyone)
    if (branchId && student.branchId !== branchId) {
      return NextResponse.json({ error: "Student is not in your branch" }, { status: 403 });
    }
    
    // If BOSS user, use student's branchId for enrollment
    const enrollmentBranchId = branchId || student.branchId;

    // Create enrollment
    const enrollment = await prisma.studentEnrollment.create({
      data: {
        studentId: validatedData.studentId,
        courseName: validatedData.courseName,
        courseType: validatedData.courseType,
        level: validatedData.level,
        notes: validatedData.notes,
        branchId: enrollmentBranchId,
        enrolledAt: validatedData.startDate ? new Date(validatedData.startDate) : new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create first payment schedule (next month)
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(7); // 7th of next month

    await prisma.paymentSchedule.create({
      data: {
        enrollmentId: enrollment.id,
        studentId: validatedData.studentId,
        amount: validatedData.monthlyAmount,
        dueDate: nextMonth,
        branchId: enrollmentBranchId,
      },
    });

    return NextResponse.json({ 
      message: "Enrollment created successfully", 
      enrollment 
    }, { status: 201 });

  } catch (error) {
    console.error("Create enrollment error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: error.errors 
      }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ 
      error: "An error occurred", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
