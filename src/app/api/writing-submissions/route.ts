import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/writing-submissions - List writing submissions (Teacher view)
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");
    const onlyUngraded = searchParams.get("onlyUngraded") === "true";

    // Build where clause based on user role
    const where: any = {};

    if (user.role === "STUDENT") {
      // Students can only see their own submissions
      where.studentId = user.id;
    } else if (user.role === "TEACHER") {
      // Teachers can see submissions from their classes
      where.OR = [
        { teacherId: user.id },
        {
          class: {
            teacherId: user.id,
          },
        },
      ];
    } else if (user.role === "BRANCH_ADMIN" || user.role === "BRANCH_BOSS") {
      // Branch admins see submissions from their branch students
      where.student = {
        branchId: user.branchId,
      };
    }
    // ADMIN and BOSS see all submissions (no filter)

    // Apply additional filters
    if (classId) {
      where.classId = classId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (onlyUngraded) {
      where.feedbackPublished = false;
    }

    const submissions = await prisma.writingSubmission.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        gradedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        attemptSection: {
          include: {
            attempt: {
              select: {
                examId: true,
              },
            },
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
      take: 100, // Limit results
    });

    // If student, filter published feedback
    const filteredSubmissions = submissions.map((sub) => {
      if (user.role === "STUDENT" && !sub.feedbackPublished) {
        return {
          id: sub.id,
          submittedAt: sub.submittedAt,
          wordCountTask1: sub.wordCountTask1,
          wordCountTask2: sub.wordCountTask2,
          feedbackStatus: "pending",
        };
      }

      return {
        id: sub.id,
        student: sub.student,
        class: sub.class,
        submittedAt: sub.submittedAt,
        wordCountTask1: sub.wordCountTask1,
        wordCountTask2: sub.wordCountTask2,
        overallBand: sub.overallBand,
        task1Band: sub.task1Band,
        task2Band: sub.task2Band,
        feedbackPublished: sub.feedbackPublished,
        gradedAt: sub.gradedAt,
        gradedBy: sub.gradedBy,
        examId: sub.attemptSection.attempt.examId,
      };
    });

    return NextResponse.json({
      submissions: filteredSubmissions,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    console.error("List writing submissions error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

