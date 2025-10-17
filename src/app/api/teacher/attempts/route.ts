import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";

/**
 * GET /api/teacher/attempts
 * Returns all attempts from students taught by this teacher
 */
export async function GET() {
  try {
    const user = await requireTeacher();
    const teacherId = (user as any).id;
    const branchId = (user as any).branchId;

    // Get all attempts from bookings assigned by this teacher
    const attempts = await prisma.attempt.findMany({
      where: {
        booking: {
          teacherId,
          ...(branchId ? { branchId } : {}),
        },
        status: {
          in: ["IN_PROGRESS", "SUBMITTED"],
        },
      },
      include: {
        booking: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            exam: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        sections: {
          select: {
            type: true,
            rawScore: true,
            maxScore: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const attemptsData = attempts.map((attempt) => {
      // Calculate total score from auto-gradable sections only
      const autoSections = attempt.sections.filter((s) => s.type !== "WRITING");
      const totalCorrect = autoSections.reduce((sum, s) => sum + (s.rawScore || 0), 0);
      const totalQuestions = autoSections.reduce((sum, s) => sum + (s.maxScore || 0), 0);
      const totalScore = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : null;

      return {
        id: attempt.id,
        studentName: attempt.booking.student.name || "Unknown",
        studentEmail: attempt.booking.student.email,
        examTitle: attempt.booking.exam.title,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
        totalScore,
        totalQuestions,
        correctAnswers: totalCorrect,
      };
    });

    return NextResponse.json({ attempts: attemptsData });
  } catch (error) {
    console.error("Teacher attempts error:", error);
    return NextResponse.json(
      { error: "Failed to load attempts" },
      { status: 500 }
    );
  }
}

