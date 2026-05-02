import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { z } from "zod";

const submitWritingSchema = z.object({
  task1Response: z.string().min(1, "Task 1 response is required"),
  task2Response: z.string().min(1, "Task 2 response is required"),
  startedAt: z.string().datetime(),
  timeSpentSeconds: z.number().min(0),
});

// Background function to score writing with AI
async function scoreWritingWithAI(
  submissionId: string,
  task1Response: string,
  task2Response: string
) {
  try {
    // Call the AI scoring endpoint
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/ai-writing-score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task1Response,
        task2Response,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI scoring failed: ${response.statusText}`);
    }

    const scores = await response.json();

    // Update the submission with AI scores
    await prisma.writingSubmission.update({
      where: { id: submissionId },
      data: {
        aiTask1TR: scores.task1?.taskResponse,
        aiTask1CC: scores.task1?.coherenceCohesion,
        aiTask1LR: scores.task1?.lexicalResource,
        aiTask1GRA: scores.task1?.grammaticalRangeAccuracy,
        aiTask1Overall: scores.task1?.overall,
        aiTask1Feedback: scores.task1?.feedback,
        aiTask2TR: scores.task2?.taskResponse,
        aiTask2CC: scores.task2?.coherenceCohesion,
        aiTask2LR: scores.task2?.lexicalResource,
        aiTask2GRA: scores.task2?.grammaticalRangeAccuracy,
        aiTask2Overall: scores.task2?.overall,
        aiTask2Feedback: scores.task2?.feedback,
        aiScoredAt: new Date(),
      },
    });
  } catch (error) {
    console.error("❌ Error in AI scoring:", error);
    throw error;
  }
}

// POST /api/attempts/[attemptId]/writing/submit - Submit IELTS Writing
export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await requireAuth();
    const { attemptId } = await params;
    const body = await request.json();

    const validatedData = submitWritingSchema.parse(body);

    // Verify attempt exists and belongs to user
    const attempt = await prisma.attempt.findFirst({
      where: {
        id: attemptId,
        studentId: user.id,
      },
      include: {
        sections: {
          where: {
            type: "WRITING",
          },
        },
        booking: {
          select: {
            classId: true,
            teacherId: true,
          },
        },
        assignment: {
          select: {
            classId: true,
            teacherId: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found or access denied" },
        { status: 404 }
      );
    }

    // Get writing section
    const writingSection = attempt.sections[0];
    if (!writingSection) {
      return NextResponse.json(
        { error: "Writing section not found" },
        { status: 404 }
      );
    }

    // Check if already submitted
    const existingSubmission = await prisma.writingSubmission.findFirst({
      where: {
        attemptSectionId: writingSection.id,
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: "Writing already submitted" },
        { status: 400 }
      );
    }

    // Calculate word counts (server-side)
    const wordCountTask1 = validatedData.task1Response
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

    const wordCountTask2 = validatedData.task2Response
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

    // Get class and teacher info
    const classId = attempt.booking?.classId || attempt.assignment?.classId || null;
    const teacherId = attempt.booking?.teacherId || attempt.assignment?.teacherId || null;

    // Create writing submission
    const submission = await prisma.writingSubmission.create({
      data: {
        attemptSectionId: writingSection.id,
        attemptId: attempt.id,
        studentId: user.id,
        classId,
        teacherId,
        task1Response: validatedData.task1Response,
        task2Response: validatedData.task2Response,
        wordCountTask1,
        wordCountTask2,
        startedAt: new Date(validatedData.startedAt),
        submittedAt: new Date(),
        timeSpentSeconds: validatedData.timeSpentSeconds,
      },
    });

    // Update writing section status
    await prisma.attemptSection.update({
      where: { id: writingSection.id },
      data: {
        status: "SUBMITTED",
        endedAt: new Date(),
      },
    });

    // Call AI scoring API in the background (don't wait for it)
    scoreWritingWithAI(submission.id, validatedData.task1Response, validatedData.task2Response)
      .catch((error) => {
        console.error("❌ AI scoring failed (non-blocking):", error);
      });

    return NextResponse.json(
      {
        success: true,
        submission: {
          id: submission.id,
          wordCountTask1,
          wordCountTask2,
          submittedAt: submission.submittedAt,
        },
      },
      { status: 201 }
    );
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

    console.error("Writing submission error:", error);
    return NextResponse.json(
      { error: "An error occurred", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

