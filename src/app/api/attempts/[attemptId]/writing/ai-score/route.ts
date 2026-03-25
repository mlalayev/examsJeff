import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { scoreIELTSWritingFull } from "@/lib/ielts-writing-ai-score";
import { countWords } from "@/lib/get-writing-task-texts";
import { checkRateLimit } from "@/lib/rate-limiter";
import { handleOpenAIError } from "@/lib/openai-client";
import { RATE_LIMITS, ROUTE_CONFIG } from "@/lib/rate-limit-config";

// Configure route for longer execution time
export const maxDuration = ROUTE_CONFIG.maxDuration;

function isStaff(role: string | undefined) {
  return (
    role === "TEACHER" ||
    role === "ADMIN" ||
    role === "BRANCH_ADMIN" ||
    role === "BOSS" ||
    role === "CREATOR"
  );
}

function serializeWritingSubmission(ws: {
  id: string;
  task1Response: string;
  task2Response: string;
  wordCountTask1: number;
  wordCountTask2: number;
  aiTask1Overall: number | null;
  aiTask1TR: number | null;
  aiTask1CC: number | null;
  aiTask1LR: number | null;
  aiTask1GRA: number | null;
  aiTask1Feedback: string | null;
  aiTask2Overall: number | null;
  aiTask2TR: number | null;
  aiTask2CC: number | null;
  aiTask2LR: number | null;
  aiTask2GRA: number | null;
  aiTask2Feedback: string | null;
  aiScoredAt: Date | null;
  overallBand: number | null;
}) {
  return {
    id: ws.id,
    task1Response: ws.task1Response,
    task2Response: ws.task2Response,
    wordCountTask1: ws.wordCountTask1,
    wordCountTask2: ws.wordCountTask2,
    aiTask1Overall: ws.aiTask1Overall,
    aiTask1TR: ws.aiTask1TR,
    aiTask1CC: ws.aiTask1CC,
    aiTask1LR: ws.aiTask1LR,
    aiTask1GRA: ws.aiTask1GRA,
    aiTask1Feedback: ws.aiTask1Feedback,
    aiTask2Overall: ws.aiTask2Overall,
    aiTask2TR: ws.aiTask2TR,
    aiTask2CC: ws.aiTask2CC,
    aiTask2LR: ws.aiTask2LR,
    aiTask2GRA: ws.aiTask2GRA,
    aiTask2Feedback: ws.aiTask2Feedback,
    aiScoredAt: ws.aiScoredAt,
    overallBand: ws.overallBand,
  };
}

/**
 * POST /api/attempts/:attemptId/writing/ai-score
 * Teacher-only: score writing with OpenAI, persist on WritingSubmission (idempotent).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await requireAuth();
    const role = (user as any).role as string | undefined;
    if (!isStaff(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Rate limiting: 10 AI scoring requests per minute per user
    const limit = RATE_LIMITS.AI_WRITING_SCORE;
    const rateLimitCheck = checkRateLimit(user.id, limit.maxRequests, limit.windowMs);
    if (rateLimitCheck.limited) {
      return NextResponse.json(
        {
          error: "Too many AI scoring requests",
          hint: `Please wait ${rateLimitCheck.resetIn} seconds before trying again.`,
          remaining: rateLimitCheck.remaining,
          resetIn: rateLimitCheck.resetIn,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.maxRequests.toString(),
            "X-RateLimit-Remaining": rateLimitCheck.remaining.toString(),
            "X-RateLimit-Reset": rateLimitCheck.resetIn.toString(),
          },
        }
      );
    }

    if (!process.env.OPENAI_API_KEY?.trim()) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY is not configured on this server",
          hint: "Add OPENAI_API_KEY to the environment that runs Next.js (e.g. .env next to the app, PM2 ecosystem env, systemd Environment=, or Docker env) and restart the process.",
        },
        { status: 503 }
      );
    }

    const { attemptId } = await params;
    const body = await req.json().catch(() => ({}));
    const force = Boolean(body?.force);

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        booking: {
          include: {
            exam: {
              include: {
                sections: {
                  include: { questions: { orderBy: { order: "asc" } } },
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
        assignment: {
          include: {
            unitExam: {
              include: {
                exam: {
                  include: {
                    sections: {
                      include: { questions: { orderBy: { order: "asc" } } },
                      orderBy: { order: "asc" },
                    },
                  },
                },
              },
            },
          },
        },
        sections: {
          include: { writingSubmission: true },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    let exam = attempt.booking?.exam ?? attempt.assignment?.unitExam?.exam ?? null;
    if (!exam?.sections?.length) {
      exam = await prisma.exam.findUnique({
        where: { id: attempt.examId },
        include: {
          sections: {
            include: { questions: { orderBy: { order: "asc" } } },
            orderBy: { order: "asc" },
          },
        },
      });
    }
    if (!exam?.sections?.length) {
      return NextResponse.json({ error: "Exam not found for this attempt" }, { status: 404 });
    }

    if (attempt.status !== "SUBMITTED") {
      return NextResponse.json({ error: "Attempt not submitted yet" }, { status: 400 });
    }

    const writingAttemptSection = attempt.sections.find((s) => s.type === "WRITING");
    if (!writingAttemptSection) {
      return NextResponse.json({ error: "Writing section not found" }, { status: 404 });
    }

    let submission = writingAttemptSection.writingSubmission;

    if (submission?.aiScoredAt && !force) {
      return NextResponse.json({
        cached: true,
        writingSubmission: serializeWritingSubmission(submission),
      });
    }

    // Get writing questions and student answers
    const writingExamSection = exam.sections.find((s: any) => s.type === "WRITING");
    if (!writingExamSection?.questions || writingExamSection.questions.length < 2) {
      return NextResponse.json(
        { error: "Writing section must have 2 questions (Task 1 & Task 2)" },
        { status: 400 }
      );
    }

    const questions = writingExamSection.questions.sort((a: any, b: any) => a.order - b.order);
    const task1Question = questions[0];
    const task2Question = questions[1];

    // Get student answers from section answers or attempt.answers
    const sectionAnswers = (writingAttemptSection.answers as Record<string, any>) || {};
    const attemptAnswers = (attempt.answers as any)?.WRITING || {};
    const allAnswers = { ...attemptAnswers, ...sectionAnswers };

    const task1Answer = String(allAnswers[task1Question.id] || submission?.task1Response || "").trim();
    const task2Answer = String(allAnswers[task2Question.id] || submission?.task2Response || "").trim();

    if (!task1Answer || !task2Answer) {
      return NextResponse.json(
        { error: "Both Task 1 and Task 2 answers are required" },
        { status: 400 }
      );
    }

    const task1WordCount = countWords(task1Answer);
    const task2WordCount = countWords(task2Answer);

    // Get question prompts
    const task1Prompt = task1Question.prompt?.text || task1Question.prompt || "Write a report";
    const task2Prompt = task2Question.prompt?.text || task2Question.prompt || "Write an essay";

    const booking = attempt.booking as
      | { classId?: string | null; teacherId?: string | null }
      | null
      | undefined;
    const classId = booking?.classId ?? attempt.assignment?.classId ?? null;
    const teacherId = booking?.teacherId ?? attempt.assignment?.teacherId ?? null;
    const submittedAt = attempt.submittedAt ?? new Date();

    // Create WritingSubmission if it doesn't exist
    if (!submission) {
      submission = await prisma.writingSubmission.create({
        data: {
          attemptSectionId: writingAttemptSection.id,
          attemptId: attempt.id,
          studentId: attempt.studentId,
          classId,
          teacherId,
          task1Response: task1Answer,
          task2Response: task2Answer,
          wordCountTask1: task1WordCount,
          wordCountTask2: task2WordCount,
          startedAt: submittedAt,
          submittedAt,
          timeSpentSeconds: 0,
        },
      });
    }

    // Score with AI (with error handling)
    let scores;
    try {
      scores = await scoreIELTSWritingFull({
        task1: {
          question: String(task1Prompt),
          userAnswer: task1Answer,
          wordCount: task1WordCount,
        },
        task2: {
          question: String(task2Prompt),
          userAnswer: task2Answer,
          wordCount: task2WordCount,
        },
      });
    } catch (aiError: any) {
      handleOpenAIError(aiError);
    }

    const updated = await prisma.writingSubmission.update({
      where: { id: submission.id },
      data: {
        task1Response: task1Answer,
        task2Response: task2Answer,
        wordCountTask1: task1WordCount,
        wordCountTask2: task2WordCount,
        aiTask1TR: scores.task1.taskResponse,
        aiTask1CC: scores.task1.coherenceCohesion,
        aiTask1LR: scores.task1.lexicalResource,
        aiTask1GRA: scores.task1.grammaticalRangeAccuracy,
        aiTask1Overall: scores.task1.overall,
        aiTask1Feedback: scores.task1.feedback,
        aiTask2TR: scores.task2.taskResponse,
        aiTask2CC: scores.task2.coherenceCohesion,
        aiTask2LR: scores.task2.lexicalResource,
        aiTask2GRA: scores.task2.grammaticalRangeAccuracy,
        aiTask2Overall: scores.task2.overall,
        aiTask2Feedback: scores.task2.feedback,
        aiScoredAt: new Date(),
        overallBand: scores.overallBand,
        task1Band: scores.task1.overall,
        task2Band: scores.task2.overall,
      },
    });

    return NextResponse.json({
      success: true,
      cached: false,
      writingSubmission: serializeWritingSubmission(updated),
    });
  } catch (e: any) {
    console.error("writing ai-score:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to score writing" },
      { status: 500 }
    );
  }
}
