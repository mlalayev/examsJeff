import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { z } from "zod";

const feedbackSchema = z.object({
  overallBand: z.number().min(0).max(9).optional().nullable(),
  task1Band: z.number().min(0).max(9).optional().nullable(),
  task2Band: z.number().min(0).max(9).optional().nullable(),
  overallComments: z.string().optional().nullable(),
  task1Comments: z.string().optional().nullable(),
  task2Comments: z.string().optional().nullable(),
  feedbackPublished: z.boolean().optional(),
});

// GET /api/writing-submissions/[id] - Get writing submission (Teacher only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const submission = await prisma.writingSubmission.findUnique({
      where: { id },
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
            teacherId: true,
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
                id: true,
                examId: true,
                startedAt: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Writing submission not found" },
        { status: 404 }
      );
    }

    // Check permissions
    // Teacher must be the class teacher OR the assigned teacher OR ADMIN/BOSS
    const isTeacherOfClass = submission.class?.teacherId === user.id;
    const isAssignedTeacher = submission.teacherId === user.id;
    const isAdmin = user.role === "ADMIN" || user.role === "BOSS" || user.role === "BRANCH_ADMIN" || user.role === "BRANCH_BOSS";
    const isStudent = submission.studentId === user.id;

    if (!isTeacherOfClass && !isAssignedTeacher && !isAdmin && !isStudent) {
      return NextResponse.json(
        { error: "Access denied. You are not the teacher of this student." },
        { status: 403 }
      );
    }

    // If student, only return submission status and their text (if published)
    if (isStudent) {
      return NextResponse.json({
        submission: {
          id: submission.id,
          task1Response: submission.task1Response,
          task2Response: submission.task2Response,
          wordCountTask1: submission.wordCountTask1,
          wordCountTask2: submission.wordCountTask2,
          submittedAt: submission.submittedAt,
          timeSpentSeconds: submission.timeSpentSeconds,
          // Only show feedback if published
          ...(submission.feedbackPublished
            ? {
                overallBand: submission.overallBand,
                task1Band: submission.task1Band,
                task2Band: submission.task2Band,
                overallComments: submission.overallComments,
                task1Comments: submission.task1Comments,
                task2Comments: submission.task2Comments,
                gradedAt: submission.gradedAt,
                gradedBy: submission.gradedBy,
              }
            : {
                feedbackStatus: "pending",
              }),
        },
      });
    }

    // Teacher/Admin: Return full details
    return NextResponse.json({
      submission: {
        id: submission.id,
        student: submission.student,
        class: submission.class,
        task1Response: submission.task1Response,
        task2Response: submission.task2Response,
        wordCountTask1: submission.wordCountTask1,
        wordCountTask2: submission.wordCountTask2,
        startedAt: submission.startedAt,
        submittedAt: submission.submittedAt,
        timeSpentSeconds: submission.timeSpentSeconds,
        overallBand: submission.overallBand,
        task1Band: submission.task1Band,
        task2Band: submission.task2Band,
        overallComments: submission.overallComments,
        task1Comments: submission.task1Comments,
        task2Comments: submission.task2Comments,
        feedbackPublished: submission.feedbackPublished,
        gradedAt: submission.gradedAt,
        gradedBy: submission.gradedBy,
        attemptId: submission.attemptSection.attempt.id,
        examId: submission.attemptSection.attempt.examId,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    console.error("Get writing submission error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

// PATCH /api/writing-submissions/[id] - Save feedback (Teacher only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const validatedData = feedbackSchema.parse(body);

    // Get submission with permissions check
    const submission = await prisma.writingSubmission.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Writing submission not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const isTeacherOfClass = submission.class?.teacherId === user.id;
    const isAssignedTeacher = submission.teacherId === user.id;
    const isAdmin = user.role === "ADMIN" || user.role === "BOSS" || user.role === "BRANCH_ADMIN" || user.role === "BRANCH_BOSS";

    if (!isTeacherOfClass && !isAssignedTeacher && !isAdmin) {
      return NextResponse.json(
        { error: "Access denied. Only the teacher of this student can provide feedback." },
        { status: 403 }
      );
    }

    // Update feedback
    const updated = await prisma.writingSubmission.update({
      where: { id },
      data: {
        overallBand: validatedData.overallBand,
        task1Band: validatedData.task1Band,
        task2Band: validatedData.task2Band,
        overallComments: validatedData.overallComments,
        task1Comments: validatedData.task1Comments,
        task2Comments: validatedData.task2Comments,
        feedbackPublished: validatedData.feedbackPublished ?? submission.feedbackPublished,
        gradedAt: new Date(),
        gradedById: user.id,
      },
    });

    console.log("✅ Writing feedback saved:", id);

    return NextResponse.json({
      success: true,
      submission: {
        id: updated.id,
        overallBand: updated.overallBand,
        task1Band: updated.task1Band,
        task2Band: updated.task2Band,
        feedbackPublished: updated.feedbackPublished,
        gradedAt: updated.gradedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    console.error("Save writing feedback error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

