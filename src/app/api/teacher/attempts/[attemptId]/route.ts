import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";

// DELETE /api/teacher/attempts/:attemptId
// Allows a teacher to delete an attempt (including in-progress/undone ones).
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    await requireTeacher();
    const { attemptId } = await params;

    if (!attemptId) {
      return NextResponse.json({ error: "Missing attemptId" }, { status: 400 });
    }

    // Ensure the attempt exists first
    const existing = await prisma.attempt.findUnique({
      where: { id: attemptId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Cascade will clean up AttemptSection etc. via Prisma schema
    await prisma.attempt.delete({
      where: { id: attemptId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Teacher delete attempt error:", error);
    return NextResponse.json(
      { error: "Failed to delete attempt" },
      { status: 500 }
    );
  }
}

