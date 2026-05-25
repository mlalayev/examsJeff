import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireStudent();
    const studentId = (user as any).id as string;
    const { id } = await params;

    const list = await prisma.wordList.findFirst({
      where: { id, isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        level: true,
        description: true,
        words: {
          orderBy: [{ order: "asc" }, { term: "asc" }],
          select: {
            id: true,
            term: true,
            definition: true,
            partOfSpeech: true,
            example: true,
            synonyms: true,
            audioUrl: true,
            imageUrl: true,
            reviews: {
              where: { studentId },
              select: { status: true, correctCount: true, wrongCount: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: "Word list not found" }, { status: 404 });
    }

    const words = list.words.map((w) => ({
      ...w,
      review: w.reviews[0] ?? null,
      reviews: undefined,
    }));

    return NextResponse.json({ list: { ...list, words } });
  } catch (error: any) {
    const status = /Unauthorized|Forbidden/.test(error?.message ?? "") ? 401 : 500;
    console.error("Student word list detail error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to load word list" },
      { status }
    );
  }
}
