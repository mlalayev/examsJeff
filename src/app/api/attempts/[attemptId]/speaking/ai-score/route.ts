import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { integrityBlock } from "@/lib/exam-integrity";
import { requireAuth } from "@/lib/auth-utils";
import {
  scoreIELTSSpeakingFromPayload,
  type IELTSSpeakingExamPayload,
  type IELTSSpeakingScoreResult,
} from "@/lib/ielts-speaking-ai-score";
import { checkRateLimit } from "@/lib/rate-limiter";
import { handleOpenAIError } from "@/lib/openai-client";
import { RATE_LIMITS } from "@/lib/rate-limit-config";
import { createHash } from "crypto";
import { speakingAnswerAudioUrl, speakingAnswerText } from "@/lib/speaking-answer";
import { resolveSpeakingPartNumber } from "@/lib/ielts-speaking-questions";

// Configure route for longer execution time
export const maxDuration = 60;

function isStaff(role: string | undefined) {
  return (
    role === "TEACHER" ||
    role === "ADMIN" ||
    role === "BRANCH_ADMIN" ||
    role === "BRANCH_BOSS" ||
    role === "BOSS" ||
    role === "CREATOR"
  );
}

function normalizeSpeakingTranscript(answer: unknown): string {
  if (typeof answer === "string") return answer.trim();
  if (answer && typeof answer === "object" && !Array.isArray(answer)) {
    const o = answer as { text?: string; transcript?: string; audioUrl?: string };
    if (typeof o.text === "string" && o.text.trim()) return o.text.trim();
    if (typeof o.transcript === "string" && o.transcript.trim()) return o.transcript.trim();
  }
  return "";
}

function collectSpeakingQuestionsFromExam(exam: {
  sections: Array<{
    id: string;
    type: string;
    parentSectionId: string | null;
    questions: Array<{
      id: string;
      qtype: string;
      order: number;
      prompt: { text?: string; part?: number } | null;
    }>;
  }>;
}) {
  const speakingIds = new Set(exam.sections.filter((s) => s.type === "SPEAKING").map((s) => s.id));
  const qs = exam.sections.filter((s) => speakingIds.has(s.id) || (s.parentSectionId && speakingIds.has(s.parentSectionId)))
    .flatMap((s) => s.questions || []);
  return Array.from(new Map(qs.map((q) => [q.id, q])).values())
    .filter((q) => q.qtype === "SPEAKING_RECORDING")
    .sort((a, b) => a.order - b.order);
}

function buildSpeakingPayload(
  questions: Array<{
    id: string;
    prompt: { text?: string; part?: number } | null;
  }>,
  answers: Record<string, unknown>
): IELTSSpeakingExamPayload {
  const part1: IELTSSpeakingExamPayload["part1"] = [];
  const part2: IELTSSpeakingExamPayload["part2"] = [];
  const part3: IELTSSpeakingExamPayload["part3"] = [];

  for (const q of questions) {
    const part = resolveSpeakingPartNumber({ ...q, prompt: q.prompt ?? undefined, order: 0 });
    const promptText = (q.prompt?.text || "").trim() || "(no prompt text)";
    const transcript = normalizeSpeakingTranscript(answers[q.id]);
    const row = { questionId: q.id, prompt: promptText, transcript };
    if (part === 2) part2.push(row);
    else if (part === 3) part3.push(row);
    else part1.push(row);
  }

  return { part1, part2, part3 };
}

function serializeSpeakingAi(r: IELTSSpeakingScoreResult, scoredAt: string) {
  return {
    overallBand: r.overallBand,
    fluencyCoherence: r.fluencyCoherence,
    lexicalResource: r.lexicalResource,
    grammar: r.grammar,
    pronunciation: r.pronunciation,
    assessmentType: r.assessmentType ?? "TRANSCRIPT_ONLY",
    part1: { band: r.part1.band, feedback: r.part1.feedback },
    part2: { band: r.part2.band, feedback: r.part2.feedback },
    part3: { band: r.part3.band, feedback: r.part3.feedback },
    overallFeedback: r.overallFeedback,
    scoredAt,
  };
}

/**
 * POST /api/attempts/:attemptId/speaking/ai-score
 * Teacher-only: score full speaking with one OpenAI call; persist on AttemptSection.rubric.ieltsSpeakingAi
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
    const limit = RATE_LIMITS.AI_SPEAKING_SCORE;
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
          hint: "Add OPENAI_API_KEY to the environment that runs Next.js and restart.",
        },
        { status: 503 }
      );
    }

    const { attemptId } = await params;
    const blocked = await integrityBlock(attemptId);
    if (blocked) return blocked;
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
        sections: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }
    if (!["ADMIN", "BOSS", "CREATOR"].includes(role || "") &&
        (!(user as any).branchId || (user as any).branchId !== attempt.branchId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let exam =
      attempt.booking?.exam ?? attempt.assignment?.unitExam?.exam ?? null;
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

    const speakingAttemptSection = attempt.sections.find((s) => s.type === "SPEAKING");
    if (!speakingAttemptSection) {
      return NextResponse.json({ error: "Speaking section not found" }, { status: 404 });
    }

    const prevRubric = (speakingAttemptSection.rubric as Record<string, unknown> | null) || {};
    const existingAi = prevRubric.ieltsSpeakingAi as { scoredAt?: string } | undefined;

    const questions = collectSpeakingQuestionsFromExam(exam as any);
    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No SPEAKING_RECORDING questions found in this exam" },
        { status: 400 }
      );
    }

    const sectionAnswers =
      (speakingAttemptSection.answers as Record<string, unknown>) || {};
    const attemptSpeaking = (attempt.answers as { SPEAKING?: Record<string, unknown> } | null)
      ?.SPEAKING;
    const mergedAnswers: Record<string, unknown> = {
      ...(attemptSpeaking || {}),
      ...sectionAnswers,
    };
    const normalized = await prisma.attemptAnswer.findMany({ where: { attemptId, section: "SPEAKING" } });
    for (const row of normalized) mergedAnswers[row.questionId] = row.answer;
    const missing = questions.filter((q) => speakingAnswerAudioUrl(mergedAnswers[q.id]) && !speakingAnswerText(mergedAnswers[q.id]));
    if (missing.length) return NextResponse.json({
      error: "Some recordings still need transcription. Generate their transcripts before AI assessment.",
      code: "TRANSCRIPTS_REQUIRED", questionIds: missing.map((q) => q.id),
    }, { status: 409 });

    const payload = buildSpeakingPayload(questions, mergedAnswers);
    const sourceHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    if (existingAi?.scoredAt && !force && (existingAi as any).sourceHash === sourceHash && (existingAi as any).assessmentType === "TRANSCRIPT_ONLY") {
      return NextResponse.json({ cached: true, speakingAi: existingAi });
    }

    const hasAnyTranscript =
      [...payload.part1, ...payload.part2, ...payload.part3].some(
        (t) => t.transcript.trim().length > 0
      );
    if (!hasAnyTranscript) {
      return NextResponse.json(
        {
          error:
            "No transcribed speaking answers found. Complete the speaking section (transcripts) first.",
        },
        { status: 400 }
      );
    }

    // Score with AI (with error handling)
    let scores;
    try {
      scores = await scoreIELTSSpeakingFromPayload(payload);
    } catch (aiError: any) {
      handleOpenAIError(aiError);
    }
    const scoredAt = new Date().toISOString();

    const newRubric = {
      ...prevRubric,
      ieltsSpeakingAi: { ...serializeSpeakingAi(scores, scoredAt), sourceHash },
    };

    const updated = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM attempts WHERE id = ${attemptId} FOR UPDATE`;
      const current = await tx.attemptSection.findUniqueOrThrow({ where: { id: speakingAttemptSection.id } });
      const rows = await tx.attemptAnswer.findMany({ where: { attemptId, section: "SPEAKING" } });
      const answers: Record<string, unknown> = { ...(attemptSpeaking || {}), ...((current.answers as Record<string, unknown>) || {}) };
      for (const row of rows) answers[row.questionId] = row.answer;
      if (createHash("sha256").update(JSON.stringify(buildSpeakingPayload(questions, answers))).digest("hex") !== sourceHash) return null;
      return tx.attemptSection.update({
        where: { id: speakingAttemptSection.id },
        data: { rubric: { ...((current.rubric as Record<string, unknown>) || {}), ieltsSpeakingAi: newRubric.ieltsSpeakingAi }, bandScore: scores.overallBand },
      });
    });
    if (!updated) return NextResponse.json({ error: "Speaking transcripts changed during assessment. Please retry." }, { status: 409 });

    const stored = (updated.rubric as Record<string, unknown>)?.ieltsSpeakingAi;

    return NextResponse.json({
      success: true,
      cached: false,
      speakingAi: stored,
    });
  } catch (e: any) {
    console.error("speaking ai-score:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to score speaking" },
      { status: 500 }
    );
  }
}
