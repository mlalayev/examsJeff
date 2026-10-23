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
 * Each explicit Test click creates a fresh attempt and booking atomically.
 * Old attempts are retained; their timers/locked modules must not be reused.
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

    const attempt = await prisma.attempt.create({
      data: {
        booking: {
          create: {
            studentId: userId,
            examId,
            branchId: userBranchId,
            startAt: new Date(),
            status: "CONFIRMED",
            sections: sectionTypes,
          },
        },
        studentId: userId,
        examId,
        ...(userBranchId ? { branch: { connect: { id: userBranchId } } } : {}),
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
