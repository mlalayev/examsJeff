import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  scoreIELTSSpeakingFromPayload,
  type IELTSSpeakingExamPayload,
  type IELTSSpeakingScoreResult,
} from "@/lib/ielts-speaking-ai-score";

function isStaff(role: string | undefined) {
  return (
    role === "TEACHER" ||
    role === "ADMIN" ||
    role === "BRANCH_ADMIN" ||
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
  const parents = exam.sections.filter((s) => !s.parentSectionId);
  const speakingParent = parents.find((s) => s.type === "SPEAKING");
  if (!speakingParent) return [];

  const subs = exam.sections.filter((s) => s.parentSectionId === speakingParent.id);
  let qs = [...(speakingParent.questions || [])];
  subs.forEach((sub) => {
    qs = [...qs, ...(sub.questions || [])];
  });

  return qs
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
    const part = q.prompt?.part ?? 1;
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
    part1: r.part1,
    part2: r.part2,
    part3: r.part3,
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
    if (existingAi?.scoredAt && !force) {
      return NextResponse.json({
        cached: true,
        speakingAi: existingAi,
      });
    }

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

    const payload = buildSpeakingPayload(questions, mergedAnswers);

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

    const scores = await scoreIELTSSpeakingFromPayload(payload);
    const scoredAt = new Date().toISOString();

    const newRubric = {
      ...prevRubric,
      ieltsSpeakingAi: serializeSpeakingAi(scores, scoredAt),
    };

    const updated = await prisma.attemptSection.update({
      where: { id: speakingAttemptSection.id },
      data: {
        rubric: newRubric as object,
        bandScore: scores.overallBand,
      },
    });

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
