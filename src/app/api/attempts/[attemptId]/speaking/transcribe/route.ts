import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getOpenAI } from "@/lib/openai-client";
import { transcriptionError } from "@/lib/transcription-error";
import { checkRateLimit } from "@/lib/rate-limiter";
import { RATE_LIMITS } from "@/lib/rate-limit-config";
import { createReadStream } from "fs";
import { writeFile, unlink, readFile } from "fs/promises";
import { speakingAnswerText, speakingAnswerAudioUrl } from "@/lib/speaking-answer";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { integrityBlock } from "@/lib/exam-integrity";

// Configure route for longer execution time
export const maxDuration = 60;

/**
 * POST /api/attempts/:attemptId/speaking/transcribe
 * Transcribes audio to text using OpenAI Whisper API
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  let tempFilePath: string | null = null;
  
  try {
    const user = await requireAuth();
    const { attemptId } = await params;
    const blocked = await integrityBlock(attemptId);
    if (blocked) return blocked;
    const studentId = (user as { id?: string }).id;

    const attempt = await prisma.attempt.findFirst({ where: { id: attemptId }, include: { sections: true } });
    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found or access denied" },
        { status: 404 },
      );
    }
    const role = (user as any).role;
    const globalStaff = ["ADMIN", "BOSS", "CREATOR"].includes(role);
    const branchStaff = ["TEACHER", "BRANCH_ADMIN", "BRANCH_BOSS"].includes(role)
      && Boolean((user as any).branchId) && (user as any).branchId === attempt.branchId;
    if (!studentId || (attempt.studentId !== studentId && !globalStaff && !branchStaff)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Rate limiting: 20 transcription requests per minute per user (more lenient than scoring)
    const limit = RATE_LIMITS.AUDIO_TRANSCRIBE;
    const rateLimitCheck = checkRateLimit(`transcribe:${user.id}`, limit.maxRequests, limit.windowMs);
    if (rateLimitCheck.limited) {
      return NextResponse.json(
        {
          error: "Too many transcription requests",
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
          code: "AI_NOT_CONFIGURED",
          error: "Audio saved. The server's transcription API key is not configured. Please contact the administrator.",
        },
        { status: 503 }
      );
    }

    // Accept the old multipart client too, but always transcribe the durable
    // recording on the server, never a second, potentially different upload.
    const questionId = req.headers.get("content-type")?.includes("application/json")
      ? (await req.json()).questionId
      : (await req.formData()).get("questionId");

    if (typeof questionId !== "string" || !questionId) {
      return NextResponse.json({ error: "Question ID required" }, { status: 400 });
    }

    // Persist recording for playback on results / teacher review
    const stored = await prisma.attemptAnswer.findUnique({
      where: { attemptId_section_questionId: { attemptId, section: "SPEAKING", questionId } },
    });
    const fallback = (attempt.sections?.find((s) => s.type === "SPEAKING")?.answers as any)?.[questionId]
      ?? (attempt.answers as any)?.SPEAKING?.[questionId];
    const savedAnswer = stored?.answer ?? fallback;
    const audioUrl = speakingAnswerAudioUrl(savedAnswer);
    if (!audioUrl) return NextResponse.json({ error: "Save the recording before transcription" }, { status: 409 });
    const existingText = speakingAnswerText(savedAnswer);
    if (existingText) return NextResponse.json({ success: true, cached: true, text: existingText, audioUrl, questionId });
    const filename = audioUrl.match(/^\/(?:api\/)?audio\/([a-zA-Z0-9_-]+\.(?:webm|mp4|m4a|ogg|wav|mp3|aac|flac|wma))$/i)?.[1];
    if (!filename) return NextResponse.json({ error: "Unsupported saved audio path" }, { status: 400 });
    let buffer: Buffer;
    try { buffer = await readFile(join(process.cwd(), "public", "audio", filename)); }
    catch { return NextResponse.json({ error: "Saved audio file was not found on the server", code: "AUDIO_MISSING" }, { status: 404 }); }
    if (!buffer.length || buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Saved recording is empty or exceeds 10MB" }, { status: 400 });
    }

    // Save to temporary file (Whisper API requires a file, not blob)
    const extension = filename.split(".").pop()?.toLowerCase();
    if (!extension || !["webm", "mp4", "m4a", "ogg", "wav", "mp3"].includes(extension)) {
      return NextResponse.json({ error: "Unsupported recording format" }, { status: 400 });
    }
    const tempFileName = `${randomUUID()}.${extension}`;
    tempFilePath = join(tmpdir(), tempFileName);
    await writeFile(tempFilePath, buffer);

    // Transcribe with OpenAI Whisper using fs.createReadStream
    const openai = getOpenAI();
    let transcription;
    try {
      transcription = await openai.audio.transcriptions.create({
        file: createReadStream(tempFilePath) as any,
        model: "whisper-1",
        language: "en", // IELTS is in English
      }, { timeout: 40000, maxRetries: 0 });
    } catch (aiError: any) {
      // Clean up temp file on AI error
      if (tempFilePath) {
        await unlink(tempFilePath).catch(() => {});
      }
      const failure = transcriptionError(aiError);
      console.error("Speaking transcription provider failure", {
        attemptId, questionId, code: failure.code, status: aiError?.status,
      });
      return NextResponse.json(failure, { status: 502 });
    }

    // Clean up temp file
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {});
    }

    if (!transcription.text?.trim()) {
      return NextResponse.json({ code: "AI_EMPTY_TRANSCRIPT", error: "Audio saved, but no speech was detected in the recording." }, { status: 422 });
    }

    const persisted = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM attempts WHERE id = ${attemptId} FOR UPDATE`;
      const latest = await tx.attemptAnswer.findUnique({
        where: { attemptId_section_questionId: { attemptId, section: "SPEAKING", questionId } },
      });
      // A late transcription must not replace a newer recording.
      if (latest && speakingAnswerAudioUrl(latest.answer) !== audioUrl) return false;
      const answer = { text: transcription.text, audioUrl };
      await tx.attemptAnswer.upsert({
        where: { attemptId_section_questionId: { attemptId, section: "SPEAKING", questionId } },
        create: { attemptId, section: "SPEAKING", questionId, answer }, update: { answer },
      });
      const sections = await tx.attemptSection.findMany({ where: { attemptId, type: "SPEAKING" } });
      for (const section of sections) {
        const rubric = { ...((section.rubric as Record<string, any>) || {}) };
        const oldAi = rubric.ieltsSpeakingAi;
        delete rubric.ieltsSpeakingAi;
        await tx.attemptSection.update({ where: { id: section.id }, data: {
          answers: { ...((section.answers as Record<string, any>) || {}), [questionId]: answer },
          ...(oldAi ? { rubric, ...(section.bandScore === oldAi.overallBand ? { bandScore: null } : {}) } : {}),
        } });
      }
      if (!sections.length) {
        const fresh = await tx.attempt.findUniqueOrThrow({ where: { id: attemptId } });
        const answers = (fresh.answers as Record<string, any>) || {};
        await tx.attempt.update({ where: { id: attemptId }, data: {
          answers: { ...answers, SPEAKING: { ...(answers.SPEAKING || {}), [questionId]: answer } },
        } });
      }
      return true;
    });
    if (!persisted) return NextResponse.json({ error: "Recording changed during transcription. Please retry." }, { status: 409 });

    return NextResponse.json({
      success: true,
      text: transcription.text,
      audioUrl,
      questionId,
    });
  } catch (error: any) {
    console.error("Transcription error:", error);
    
    // Clean up temp file on error
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {});
    }
    
    return NextResponse.json(
      {
        error: "Transcription failed",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
