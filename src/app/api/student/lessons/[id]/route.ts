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

    const lesson = await prisma.lesson.findFirst({
      where: { id, isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        level: true,
        summary: true,
        content: true,
        coverImage: true,
        videoUrl: true,
        durationMin: true,
        progress: {
          where: { studentId },
          select: { status: true, progressPct: true, lastViewedAt: true },
          take: 1,
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json({ lesson });
  } catch (error: any) {
    const status = /Unauthorized|Forbidden/.test(error?.message ?? "") ? 401 : 500;
    console.error("Student lesson detail error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to load lesson" },
      { status }
    );
  }
}
