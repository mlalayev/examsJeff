import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireHomeworkManager } from "@/lib/homework-access";
import { buildGenericExamInitial } from "@/lib/exam-builder-initial";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  track: z.string().nullable().optional(),
  durationMin: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireHomeworkManager();
    const { id } = await params;

    const exam = await prisma.exam.findFirst({
      where: { id, isHomework: true },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: { questions: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    return NextResponse.json({
      exam,
      initial: buildGenericExamInitial(exam as Parameters<typeof buildGenericExamInitial>[0]),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load homework";
    const status = /Unauthorized|Forbidden/.test(message) ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireHomeworkManager();
    const { id } = await params;
    const role = (user as { role: string }).role;
    const userId = (user as { id: string }).id;

    const existing = await prisma.exam.findFirst({
      where: { id, isHomework: true },
      select: { id: true, createdById: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }
    if (role === "TEACHER" && existing.createdById !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = updateSchema.parse(body);

    const exam = await prisma.exam.update({
      where: { id },
      data,
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: { questions: { orderBy: { order: "asc" } } },
        },
      },
    });

    return NextResponse.json({ exam });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to update homework";
    const status = /Unauthorized|Forbidden/.test(message) ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
