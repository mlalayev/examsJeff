import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

/**
 * GET /api/admin/students/:id/exams — All exam attempts for a student (ADMIN, BOSS, CREATOR).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: studentId } = await params;

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true },
    });

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const attempts = await prisma.attempt.findMany({
      where: {
        OR: [{ studentId }, { booking: { studentId } }],
      },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: {
        id: true,
        status: true,
        createdAt: true,
        submittedAt: true,
        examId: true,
        exam: {
          select: { id: true, title: true, category: true, track: true },
        },
        booking: {
          select: { id: true, startAt: true },
        },
      },
    });

    const seen = new Set<string>();
    const rows = attempts.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });

    return NextResponse.json({
      exams: rows.map((a) => ({
        attemptId: a.id,
        examId: a.examId,
        examTitle: a.exam?.title ?? "Unknown exam",
        category: a.exam?.category ?? null,
        track: a.exam?.track ?? null,
        status: a.status,
        createdAt: a.createdAt,
        submittedAt: a.submittedAt,
        bookingId: a.booking?.id ?? null,
        assignedAt: a.booking?.startAt ?? null,
      })),
    });
  } catch (error) {
    console.error("Admin student exams:", error);
    return NextResponse.json(
      { error: "Failed to load student exams" },
      { status: 500 }
    );
  }
}
