import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

// POST /api/admin/students/:id/lesson-status
// Body: { stopped: boolean }
// Marks a student's lessons as stopped or continuing.
// Accessible to CREATOR / ADMIN / BOSS.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { stopped } = body ?? {};

    if (typeof stopped !== "boolean") {
      return NextResponse.json(
        { error: "stopped must be a boolean" },
        { status: 400 }
      );
    }

    const student = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, branchId: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    if (student.role !== "STUDENT") {
      return NextResponse.json(
        { error: "User is not a student" },
        { status: 400 }
      );
    }

    if (!student.branchId) {
      return NextResponse.json(
        { error: "Student must be assigned to a branch first" },
        { status: 400 }
      );
    }

    const now = new Date();
    const profile = await prisma.studentProfile.upsert({
      where: { studentId: id },
      create: {
        studentId: id,
        branchId: student.branchId,
        lessonsStopped: stopped,
        lessonsStoppedAt: stopped ? now : null,
        studyStatus: stopped ? "STOPPED" : "CONTINUES",
      },
      update: {
        lessonsStopped: stopped,
        lessonsStoppedAt: stopped ? now : null,
        studyStatus: stopped ? "STOPPED" : "CONTINUES",
      },
      select: {
        studentId: true,
        lessonsStopped: true,
        lessonsStoppedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: stopped
        ? "Lessons marked as stopped"
        : "Lessons marked as continuing",
      profile,
    });
  } catch (error: any) {
    if (typeof error?.message === "string" && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error updating lesson status:", error);
    return NextResponse.json(
      { error: "Failed to update lesson status" },
      { status: 500 }
    );
  }
}
