import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import {
  parseLessonCategory,
  clampLimit,
  type LessonListItem,
} from "@/lib/student-content";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireStudent();
    const studentId = (user as any).id as string;

    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    if (!categorySlug) {
      return NextResponse.json(
        { error: "category query param is required" },
        { status: 400 }
      );
    }

    const category = parseLessonCategory(categorySlug);
    const limit = clampLimit(searchParams.get("limit"));
    const cursor = searchParams.get("cursor") || undefined;

    const lessons = await prisma.lesson.findMany({
      where: { category, isPublished: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true,
        title: true,
        slug: true,
        level: true,
        summary: true,
        coverImage: true,
        durationMin: true,
        order: true,
        progress: {
          where: { studentId },
          select: { status: true, progressPct: true },
          take: 1,
        },
      },
    });

    let nextCursor: string | null = null;
    if (lessons.length > limit) {
      const next = lessons.pop()!;
      nextCursor = next.id;
    }

    const items: LessonListItem[] = lessons.map((l) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      level: l.level,
      summary: l.summary,
      coverImage: l.coverImage,
      durationMin: l.durationMin,
      order: l.order,
      status: l.progress[0]?.status ?? "NOT_STARTED",
      progressPct: l.progress[0]?.progressPct ?? 0,
    }));

    return NextResponse.json({ items, nextCursor });
  } catch (error: any) {
    const status = /Unauthorized|Forbidden/.test(error?.message ?? "") ? 401 : 500;
    console.error("Student lessons list error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to load lessons" },
      { status }
    );
  }
}
