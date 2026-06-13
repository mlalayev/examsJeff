import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

/**
 * POST /api/admin/exams/:id/test-attempt
 *
 * Lets an ADMIN / BOSS / CREATOR take an exam for testing purposes.
 * It reuses the normal student attempt flow (run -> submit -> results) by
 * creating a "test" Booking + Attempt owned by the current admin user.
 *
 * Behaviour:
 *  - If a test attempt already exists for this admin + exam and is still
 *    IN_PROGRESS, it is reused (continue where you left off).
 *  - If the previous test attempt was already SUBMITTED, it is reset so the
 *    admin gets a fresh run each time.
 *
 * Because the attempt is owned by an admin (not a STUDENT), it does not appear
 * in student-facing analytics. The results page renders the full teacher review
 * (correct answers + explanations) for these roles.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const userId = (user as any).id as string;
    const userBranchId = (user as any).branchId ?? null;
    const { id: examId } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        sections: { orderBy: { order: "asc" } },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (!exam.sections || exam.sections.length === 0) {
      return NextResponse.json(
        { error: "This exam has no sections to take." },
        { status: 400 }
      );
    }

    const examSections = exam.sections;
    const sectionTypes = examSections.map((s) => s.type);

    // Find an existing test booking owned by this admin for this exam.
    let booking = await prisma.booking.findFirst({
      where: { studentId: userId, examId },
      include: { attempt: true },
    });

    // Reuse an in-progress test attempt so the admin can continue.
    if (booking?.attempt && booking.attempt.status === "IN_PROGRESS") {
      return NextResponse.json({
        attemptId: booking.attempt.id,
        examCategory: exam.category,
        message: "Continuing existing test attempt",
      });
    }

    // Otherwise reset any previous (submitted) test attempt for a clean run.
    if (booking?.attempt) {
      await prisma.attempt.delete({ where: { id: booking.attempt.id } });
    }

    // Create the test booking if one doesn't exist yet.
    if (!booking) {
      booking = (await prisma.booking.create({
        data: {
          studentId: userId,
          examId,
          branchId: userBranchId,
          startAt: new Date(),
          status: "CONFIRMED",
          sections: sectionTypes,
        },
        include: { attempt: true },
      })) as typeof booking;
    }

    const attempt = await prisma.attempt.create({
      data: {
        bookingId: booking!.id,
        studentId: userId,
        examId,
        branchId: userBranchId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        sections: {
          create: examSections.map((section) => ({
            type: section.type,
            status: "IN_PROGRESS",
          })),
        },
      },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      examCategory: exam.category,
      message: "Test attempt created successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isForbidden =
      message.toLowerCase().includes("forbidden") ||
      message.toLowerCase().includes("unauthorized");
    if (isForbidden) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    console.error("Start test attempt error:", error);
    return NextResponse.json(
      { error: "Failed to start test attempt" },
      { status: 500 }
    );
  }
}
