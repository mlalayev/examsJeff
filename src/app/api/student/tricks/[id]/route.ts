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

    const trick = await prisma.trick.findFirst({
      where: { id, isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        summary: true,
        content: true,
        coverImage: true,
        videoUrl: true,
        saves: {
          where: { studentId },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!trick) {
      return NextResponse.json({ error: "Trick not found" }, { status: 404 });
    }

    return NextResponse.json({
      trick: { ...trick, saved: trick.saves.length > 0, saves: undefined },
    });
  } catch (error: any) {
    const status = /Unauthorized|Forbidden/.test(error?.message ?? "") ? 401 : 500;
    console.error("Student trick detail error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to load trick" },
      { status }
    );
  }
}
