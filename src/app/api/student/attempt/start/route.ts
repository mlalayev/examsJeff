import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    const user = await requireStudent();
    const studentId = (user as any).id;
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // Verify booking belongs to this student
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        exam: {
          include: {
            sections: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.studentId !== studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if attempt already exists for this booking
    let attempt = await prisma.attempt.findUnique({
      where: { bookingId },
    });

    if (attempt) {
      // Return existing attempt
      return NextResponse.json({
        attemptId: attempt.id,
        message: "Continuing existing attempt",
      });
    }

    // Create new attempt with sections
    attempt = await prisma.attempt.create({
      data: {
        bookingId,
        studentId,
        examId: booking.examId,
        branchId: booking.branchId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        sections: {
          create: booking.sections.map((sectionType) => ({
            type: sectionType,
            status: "IN_PROGRESS",
          })),
        },
      },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      message: "Attempt created successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isForbidden =
      message.toLowerCase().includes("forbidden") ||
      message.toLowerCase().includes("unauthorized");
    if (isForbidden) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    console.error("Start attempt error:", error);
    return NextResponse.json({ error: "Failed to start attempt" }, { status: 500 });
  }
}

