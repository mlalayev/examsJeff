import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getOpenAI, handleOpenAIError } from "@/lib/openai-client";
import { checkRateLimit } from "@/lib/rate-limiter";
import { RATE_LIMITS } from "@/lib/rate-limit-config";
import { createReadStream } from "fs";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

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
    const studentId = (user as { id?: string }).id;

    const attempt = await prisma.attempt.findFirst({
      where: { id: attemptId, studentId: studentId ?? undefined },
    });
    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found or access denied" },
        { status: 404 },
      );
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
          error: "OPENAI_API_KEY is not configured",
          hint: "Set OPENAI_API_KEY in server environment",
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const questionId = formData.get("questionId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    if (!questionId) {
      return NextResponse.json({ error: "Question ID required" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 },
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Persist recording for playback on results / teacher review
    const storedName = `speaking-${attemptId}-${questionId}-${Date.now()}-${randomUUID().slice(0, 8)}.webm`;
    const audioDir = join(process.cwd(), "public", "audio");
    await mkdir(audioDir, { recursive: true });
    await writeFile(join(audioDir, storedName), buffer);
    const audioUrl = `/api/audio/${storedName}`;

    // Save to temporary file (Whisper API requires a file, not blob)
    const tempFileName = `${randomUUID()}.webm`;
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
      });
    } catch (aiError: any) {
      // Clean up temp file on AI error
      if (tempFilePath) {
        await unlink(tempFilePath).catch(() => {});
      }
      handleOpenAIError(aiError);
    }

    // Clean up temp file
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {});
    }

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
