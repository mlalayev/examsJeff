import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const user = await requireStudent();
    const { attemptId } = await params;
    const studentId = (user as any).id as string;
    const body = await request.json();

    const { sectionType, answers } = body as { sectionType: string; answers: any };
    if (!sectionType) return NextResponse.json({ error: "sectionType required" }, { status: 400 });

    const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    if (attempt.studentId !== studentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.attemptSection.updateMany({
      where: { attemptId, type: sectionType as any },
      data: { answers },
    });

    return NextResponse.json({ success: true, updated: updated.count });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isForbidden = message.toLowerCase().includes("forbidden") || message.toLowerCase().includes("unauthorized");
    if (isForbidden) return NextResponse.json({ error: message }, { status: 403 });
    console.error("Save attempt answers error:", error);
    return NextResponse.json({ error: "Failed to save answers" }, { status: 500 });
  }
}
