import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import {
  parseTrickCategory,
  clampLimit,
  type TrickListItem,
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

    const category = parseTrickCategory(categorySlug);
    const limit = clampLimit(searchParams.get("limit"));
    const cursor = searchParams.get("cursor") || undefined;

    const tricks = await prisma.trick.findMany({
      where: { category, isPublished: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        coverImage: true,
        videoUrl: true,
        order: true,
        saves: {
          where: { studentId },
          select: { id: true },
          take: 1,
        },
      },
    });

    let nextCursor: string | null = null;
    if (tricks.length > limit) {
      const next = tricks.pop()!;
      nextCursor = next.id;
    }

    const items: TrickListItem[] = tricks.map((t) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      summary: t.summary,
      coverImage: t.coverImage,
      videoUrl: t.videoUrl,
      order: t.order,
      saved: t.saves.length > 0,
    }));

    return NextResponse.json({ items, nextCursor });
  } catch (error: any) {
    const status = /Unauthorized|Forbidden/.test(error?.message ?? "") ? 401 : 500;
    console.error("Student tricks list error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to load tricks" },
      { status }
    );
  }
}
