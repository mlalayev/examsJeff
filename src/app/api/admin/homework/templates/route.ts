import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getScopedBranchId } from "@/lib/auth-utils";
import { requireHomeworkManager } from "@/lib/homework-access";
import { createExamContent } from "@/lib/exam-content-create";
import { createHomeworkTemplateSchema } from "@/lib/homework-schemas";
import { formatUserName } from "@/lib/homework-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireHomeworkManager();
    const role = (user as { role: string }).role;
    const userId = (user as { id: string }).id;
    const branchId = getScopedBranchId(user);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const where: Record<string, unknown> = { isHomework: true };
    if (role === "TEACHER") {
      where.createdById = userId;
    }
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }
    if (branchId) {
      where.createdBy = { branchId };
    }

    const items = await prisma.exam.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        category: true,
        track: true,
        isActive: true,
        durationMin: true,
        createdAt: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: {
            sections: true,
            homeworkAssignments: true,
          },
        },
      },
    });

    return NextResponse.json({
      items: items.map((e) => ({
        id: e.id,
        title: e.title,
        category: e.category,
        track: e.track,
        isActive: e.isActive,
        durationMin: e.durationMin,
        createdAt: e.createdAt,
        sectionCount: e._count.sections,
        assignmentCount: e._count.homeworkAssignments,
        createdBy: e.createdBy
          ? {
              id: e.createdBy.id,
              name: formatUserName(e.createdBy),
            }
          : null,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load homework";
    const status = /Unauthorized|Forbidden/.test(message) ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireHomeworkManager();
    const body = await request.json();
    const data = createHomeworkTemplateSchema.parse(body);

    const exam = await createExamContent({
      ...data,
      isHomework: true,
      createdById: (user as { id: string }).id,
    });

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to create homework";
    const status = /Unauthorized|Forbidden/.test(message) ? 403 : 500;
    console.error("Create homework template error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
