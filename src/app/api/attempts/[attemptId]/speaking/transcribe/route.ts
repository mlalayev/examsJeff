import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getOpenAI } from "@/lib/openai-client";
import { createReadStream } from "fs";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

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

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to temporary file (Whisper API requires a file, not blob)
    const tempFileName = `${randomUUID()}.webm`;
    tempFilePath = join(tmpdir(), tempFileName);
    await writeFile(tempFilePath, buffer);

    // Transcribe with OpenAI Whisper using fs.createReadStream
    const openai = getOpenAI();
    const transcription = await openai.audio.transcriptions.create({
      file: createReadStream(tempFilePath) as any,
      model: "whisper-1",
      language: "en", // IELTS is in English
    });

    // Clean up temp file
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      text: transcription.text,
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
