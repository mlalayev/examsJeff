import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireTeacher } from "@/lib/auth-utils";
import { z } from "zod";

const createBookingSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  examId: z.string().min(1, "Exam ID is required"),
  sections: z.array(z.enum(["READING", "LISTENING", "WRITING", "SPEAKING"])).min(1, "At least one section is required"),
  startAt: z.string().datetime("Invalid date format"), // ISO 8601 UTC
  status: z.string().optional().default("CONFIRMED"),
});

// POST /api/bookings - Create a new booking (assign exam to student)
export async function POST(request: Request) {
  try {
    const user = await requireTeacher();
    const body = await request.json();
    
    const validatedData = createBookingSchema.parse(body);
    
    // Parse the startAt date
    const startAt = new Date(validatedData.startAt);
    
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
    
    // Verify the student is in one of the teacher's classes
    const classEnrollment = await prisma.classStudent.findFirst({
      where: {
        studentId: validatedData.studentId,
        class: {
          teacherId: (user as any).id,
        }
      }
    });
    
    if (!classEnrollment) {
      return NextResponse.json(
        { error: "Student is not enrolled in any of your classes" },
        { status: 403 }
      );
    }
    
    // Verify the exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: validatedData.examId }
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
    
    // Check for conflicting bookings (within 2 hours window)
    const twoHoursBefore = new Date(startAt.getTime() - 2 * 60 * 60 * 1000);
    const twoHoursAfter = new Date(startAt.getTime() + 2 * 60 * 60 * 1000);
    
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        studentId: validatedData.studentId,
        startAt: {
          gte: twoHoursBefore,
          lte: twoHoursAfter,
        },
        status: {
          in: ["CONFIRMED", "IN_PROGRESS"]
        }
      }
    });
    
    if (conflictingBooking) {
      return NextResponse.json(
        { error: "Student already has a booking scheduled near this time" },
        { status: 409 }
      );
    }
    
    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        studentId: validatedData.studentId,
        teacherId: (user as any).id,
        examId: validatedData.examId,
        sections: validatedData.sections,
        startAt,
        status: validatedData.status,
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
    } else if (role === "teacher" || userRole === "TEACHER") {
      // Teacher sees bookings they created
      bookings = await prisma.booking.findMany({
        where: {
          teacherId: userId,
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

