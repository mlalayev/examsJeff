import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";

// GET /api/teacher/students/[id]/feedback - Feedback history for a student.
// Scoped to records authored by the requesting teacher so a teacher can only
// see their own feedback. (A separate parent-facing route can expose the full
// cross-teacher history later.)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireTeacher();
    const { id: studentId } = await params;

    const student = await prisma.user.findFirst({
      where: { id: studentId, role: "STUDENT" },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const records = await prisma.lessonStudentRecord.findMany({
      where: {
        studentId,
        teacherId: (user as any).id,
      },
      include: {
        class: { select: { id: true, name: true } },
        lessonSession: {
          select: { id: true, title: true, date: true, timeSlot: true, status: true },
        },
      },
      orderBy: { lessonSession: { date: "desc" } },
    });

    return NextResponse.json({
      student: {
        id: student.id,
        email: student.email,
        name:
          [student.firstName, student.lastName].filter(Boolean).join(" ").trim() ||
          null,
      },
      records,
    });
  } catch (error) {
    return handleApiError(error, "Get student feedback history error");
  }
}
