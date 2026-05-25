import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import {
  parseWordListCategory,
  clampLimit,
  type WordListItem,
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

    const category = parseWordListCategory(categorySlug);
    const limit = clampLimit(searchParams.get("limit"));
    const cursor = searchParams.get("cursor") || undefined;

    const lists = await prisma.wordList.findMany({
      where: { category, isPublished: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true,
        title: true,
        slug: true,
        level: true,
        description: true,
        order: true,
        _count: { select: { words: true } },
      },
    });

    let nextCursor: string | null = null;
    if (lists.length > limit) {
      const next = lists.pop()!;
      nextCursor = next.id;
    }

    const listIds = lists.map((l) => l.id);
    const mastered = listIds.length
      ? await prisma.word.groupBy({
          by: ["wordListId"],
          where: {
            wordListId: { in: listIds },
            reviews: { some: { studentId, status: "MASTERED" } },
          },
          _count: { _all: true },
        })
      : [];
    const masteredByList = new Map(
      mastered.map((m) => [m.wordListId, m._count._all])
    );

    const items: WordListItem[] = lists.map((l) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      level: l.level,
      description: l.description,
      order: l.order,
      totalWords: l._count.words,
      mastered: masteredByList.get(l.id) ?? 0,
    }));

    return NextResponse.json({ items, nextCursor });
  } catch (error: any) {
    const status = /Unauthorized|Forbidden/.test(error?.message ?? "") ? 401 : 500;
    console.error("Student word lists error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to load word lists" },
      { status }
    );
  }
}
