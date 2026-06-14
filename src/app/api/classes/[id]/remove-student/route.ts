import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const removeStudentSchema = z.object({
  studentId: z.string().min(1, "studentId is required"),
});

// POST /api/classes/[id]/remove-student - Remove a student from a class
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireTeacher();
    const { id: classId } = await params;
    const body = await request.json();
    const { studentId } = removeStudentSchema.parse(body);

    // Verify the class belongs to this teacher
    const classExists = await prisma.class.findFirst({
      where: { id: classId, teacherId: (user as any).id },
      select: { id: true },
    });

    if (!classExists) {
      return NextResponse.json(
        { error: "Class not found or you don't have permission to modify it" },
        { status: 404 }
      );
    }

    // Ensure the enrollment exists in this class before deleting
    const enrollment = await prisma.classStudent.findUnique({
      where: { classId_studentId: { classId, studentId } },
      select: { id: true },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Student is not enrolled in this class" },
        { status: 404 }
      );
    }

    await prisma.classStudent.delete({ where: { id: enrollment.id } });

    return NextResponse.json({ message: "Student removed successfully" });
  } catch (error) {
    return handleApiError(error, "Remove student error");
  }
}
