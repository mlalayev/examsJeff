import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const user = await requireStudent();
    const { attemptId } = await params;
    const studentId = (user as any).id as string;

    const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    if (attempt.studentId !== studentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (attempt.status === "SUBMITTED") {
      return NextResponse.json({ success: true, attemptId });
    }

    await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, attemptId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isForbidden = message.toLowerCase().includes("forbidden") || message.toLowerCase().includes("unauthorized");
    if (isForbidden) return NextResponse.json({ error: message }, { status: 403 });
    console.error("Submit attempt error:", error);
    return NextResponse.json({ error: "Failed to submit attempt" }, { status: 500 });
  }
}

