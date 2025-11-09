import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdminOrBoss, requireBranchAdminOrBoss, getScopedBranchId, assertSameBranchOrBoss } from "@/lib/auth-utils";
import { z } from "zod";

const createBookingSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  examId: z.string().min(1, "Exam ID is required"),
  status: z.string().optional().default("CONFIRMED"),
});

// POST /api/bookings - Create a new booking (assign exam to student)
// ADMIN, BOSS, BRANCH_ADMIN, and BRANCH_BOSS can assign exams
export async function POST(request: Request) {
  try {
    // Try requireAdminOrBoss first, if fails try requireBranchAdminOrBoss
    let user;
    try {
      user = await requireAdminOrBoss();
    } catch {
      user = await requireBranchAdminOrBoss();
    }
    const body = await request.json();
    
    const validatedData = createBookingSchema.parse(body);
    
    // Verify the student exists and is a STUDENT
    const student = await prisma.user.findUnique({
      where: { id: validatedData.studentId }
    });
    
    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }
    
    if (student.role !== "STUDENT") {
      return NextResponse.json(
        { error: "User must have STUDENT role" },
        { status: 400 }
      );
    }
    
    // For ADMIN/BOSS: verify student exists and check branch access
    const userRole = (user as any).role;
    const userBranchId = (user as any).branchId ?? null;
    
    // Check branch access for BRANCH_ADMIN/BRANCH_BOSS
    // If student has no branch, allow branch admin to assign (they will assign to their branch)
    // If student has a branch, check that it matches the admin's branch (or admin is BOSS/ADMIN)
    if (student.branchId) {
      assertSameBranchOrBoss(user, student.branchId);
    } else if (userRole === "BRANCH_ADMIN" || userRole === "BRANCH_BOSS") {
      // If student has no branch and admin is branch admin, allow assignment
      // The booking will be created with the admin's branchId
    }
    
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
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      );
    }
    
    if (!exam.isActive) {
      return NextResponse.json(
        { error: "Exam is not active" },
        { status: 400 }
      );
    }
    
    // Get sections from exam
    const examSections = exam.sections.map(s => s.type);
    
    if (examSections.length === 0) {
      return NextResponse.json(
        { error: "Exam has no sections" },
        { status: 400 }
      );
    }
    
    // Use current time as startAt
    const startAt = new Date();
    
    // Create the booking
    // For ADMIN/BOSS, teacherId can be null or set to the assigning admin
    const booking = await prisma.booking.create({
      data: {
        studentId: validatedData.studentId,
        teacherId: null, // Admin-assigned exams don't need a teacher
        examId: validatedData.examId,
        sections: examSections,
        startAt,
        status: validatedData.status,
        branchId: userBranchId ?? student.branchId ?? null,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        exam: {
          select: {
            id: true,
            title: true,
          }
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    
    return NextResponse.json({
      message: "Exam assigned successfully",
      booking
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
    
    console.error("Create booking error:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the booking" },
      { status: 500 }
    );
  }
}

// GET /api/bookings - List bookings filtered by role
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    
    const userRole = (user as any).role;
    const userId = (user as any).id;
    
    let bookings;
    
    if (role === "student" || userRole === "STUDENT") {
      // Student sees their own bookings
      bookings = await prisma.booking.findMany({
        where: {
          studentId: userId,
        },
        include: {
          exam: {
            select: {
              id: true,
              title: true,
            }
          },
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: {
          startAt: "asc"
        }
      });
    } else if (role === "teacher" || userRole === "TEACHER" || userRole === "BRANCH_ADMIN") {
      // Teacher sees bookings they created
      bookings = await prisma.booking.findMany({
        where: {
          ...(userRole === "TEACHER" ? { teacherId: userId } : {}),
          ...(userRole === "BRANCH_ADMIN" ? { branchId: (user as any).branchId ?? undefined } : {}),
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          exam: {
            select: {
              id: true,
              title: true,
            }
          }
        },
        orderBy: {
          startAt: "asc"
        }
      });
    } else if (userRole === "ADMIN") {
      // Admin sees all bookings
      bookings = await prisma.booking.findMany({
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          exam: {
            select: {
              id: true,
              title: true,
            }
          },
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: {
          startAt: "asc"
        }
      });
    } else if (userRole === "BOSS") {
      bookings = await prisma.booking.findMany({
        include: {
          student: { select: { id: true, name: true, email: true } },
          exam: { select: { id: true, title: true } },
          teacher: { select: { id: true, name: true, email: true } }
        },
        orderBy: { startAt: "asc" }
      });
    } else {
      return NextResponse.json(
        { error: "Invalid role parameter" },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ bookings });
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    
    console.error("List bookings error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching bookings" },
      { status: 500 }
    );
  }
}

