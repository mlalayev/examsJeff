import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import { LessonProgressStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z
    .enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"])
    .optional(),
  progressPct: z.number().int().min(0).max(100).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireStudent();
    const studentId = (user as any).id as string;
    const { id: lessonId } = await params;

    const body = bodySchema.parse(await request.json().catch(() => ({})));

    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, isPublished: true },
      select: { id: true },
    });
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const now = new Date();
    const nextStatus = (body.status ?? "IN_PROGRESS") as LessonProgressStatus;
    const nextPct =
      body.progressPct ?? (nextStatus === "COMPLETED" ? 100 : undefined);

    const progress = await prisma.lessonProgress.upsert({
      where: { lessonId_studentId: { lessonId, studentId } },
      update: {
        status: nextStatus,
        ...(nextPct !== undefined ? { progressPct: nextPct } : {}),
        lastViewedAt: now,
        ...(nextStatus === "COMPLETED" ? { completedAt: now } : {}),
        ...(nextStatus === "IN_PROGRESS" ? { startedAt: now } : {}),
      },
      create: {
        lessonId,
        studentId,
        status: nextStatus,
        progressPct: nextPct ?? 0,
        startedAt: nextStatus !== "NOT_STARTED" ? now : null,
        completedAt: nextStatus === "COMPLETED" ? now : null,
        lastViewedAt: now,
      },
      select: { status: true, progressPct: true, lastViewedAt: true },
    });

    return NextResponse.json({ progress });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid body", issues: error.issues },
        { status: 400 }
      );
    }
    const status = /Unauthorized|Forbidden/.test(error?.message ?? "") ? 401 : 500;
    console.error("Lesson progress error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to update progress" },
      { status }
    );
  }
}
