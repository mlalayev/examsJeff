import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { integrityBlock } from "@/lib/exam-integrity";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// POST /api/attempts/[attemptId]/speaking/upload - Upload speaking recording
export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await requireAuth();
    const { attemptId } = await params;
    const blocked = await integrityBlock(attemptId);
    if (blocked) return blocked;

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

    const question = await prisma.question.findFirst({
      // Question.examId is optional; builders attach questions through sectionId.
      // Use the same section -> exam relationship as the attempt reader.
      where: { id: questionId, section: { examId: attempt.examId, type: "SPEAKING" } },
      select: { id: true },
    });
    if (!question) return NextResponse.json({ error: "Invalid speaking question" }, { status: 400 });
    if (attempt.status !== "IN_PROGRESS") return NextResponse.json({ error: "Attempt is already submitted" }, { status: 409 });

    // Validate file type
    const validAudioExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".mp4", ".aac", ".webm", ".flac", ".wma"];
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
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validAudioExtensions.includes(`.${ext}`) || file.size === 0) {
      return NextResponse.json({ error: "Invalid or empty recording" }, { status: 400 });
    }
    const filename = `speaking-${randomUUID()}.${ext}`;

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
    const publicPath = `/api/audio/${filename}`;
    const answer = { text: "", audioUrl: publicPath };
    await prisma.$transaction(async (tx) => {
      // Lock the attempt before merging concurrent question uploads.
      await tx.$queryRaw`SELECT id FROM attempts WHERE id = ${attemptId} FOR UPDATE`;
      const current = await tx.attempt.findUniqueOrThrow({ where: { id: attemptId } });
      if (current.status !== "IN_PROGRESS") throw new Error("Attempt is already submitted");
      await tx.attemptAnswer.upsert({
        where: { attemptId_section_questionId: { attemptId, section: "SPEAKING", questionId } },
        create: { attemptId, section: "SPEAKING", questionId, answer },
        update: { answer },
      });
      const sections = await tx.attemptSection.findMany({ where: { attemptId, type: "SPEAKING" } });
      for (const section of sections) {
        await tx.attemptSection.update({ where: { id: section.id }, data: {
          answers: { ...((section.answers as Record<string, any>) || {}), [questionId]: answer },
        } });
      }
      if (!sections.length) {
        const fresh = await tx.attempt.findUniqueOrThrow({ where: { id: attemptId } });
        const answers = (fresh.answers as Record<string, any>) || {};
        await tx.attempt.update({ where: { id: attemptId }, data: {
          answers: { ...answers, SPEAKING: { ...(answers.SPEAKING || {}), [questionId]: answer } },
        } });
      }
    });

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

