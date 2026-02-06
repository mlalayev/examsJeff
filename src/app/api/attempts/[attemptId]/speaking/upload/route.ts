import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// POST /api/attempts/[attemptId]/speaking/upload - Upload speaking recording
export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await requireAuth();
    const { attemptId } = await params;

    // Verify attempt belongs to user
    const attempt = await prisma.attempt.findFirst({
      where: {
        id: attemptId,
        studentId: user.id,
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found or access denied" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const questionId = formData.get("questionId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!questionId) {
      return NextResponse.json({ error: "Question ID required" }, { status: 400 });
    }

    // Validate file type
    const validAudioExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".webm", ".flac", ".wma"];
    const hasValidExtension = validAudioExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExtension && !file.type.includes('audio')) {
      return NextResponse.json(
        { error: "Only audio files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop();
    const filename = `speaking-${attemptId}-${questionId}-${timestamp}-${randomStr}.${ext}`;

    // Save to public/audio
    const uploadDir = "public/audio";
    const filePath = join(process.cwd(), uploadDir, filename);

    // Ensure directory exists
    try {
      await mkdir(join(process.cwd(), uploadDir), { recursive: true });
    } catch (error) {
      // Directory already exists, ignore error
    }

    // Write file
    await writeFile(filePath, buffer);

    // Return public URL
    const publicPath = `/audio/${filename}`;

    return NextResponse.json(
      {
        url: publicPath,
        filename: filename,
        size: file.size
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    console.error("Speaking upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload audio file" },
      { status: 500 }
    );
  }
}

