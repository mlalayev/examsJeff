import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { classAccessWhere } from "@/lib/class-access";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const removeStudentSchema = z.object({
  studentId: z.string().min(1, "studentId is required"),
});

// POST /api/classes/[id]/remove-student
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireTeacher();
    const { id: classId } = await params;
    const body = await request.json();
    const { studentId } = removeStudentSchema.parse(body);

    const classExists = await prisma.class.findFirst({
      where: {
        id: classId,
        ...classAccessWhere({
          id: (user as any).id,
          role: (user as any).role,
          branchId: (user as any).branchId,
        }),
      },
      select: { id: true },
    });

    if (!classExists) {
      return NextResponse.json(
        { error: "Class not found or you don't have permission to modify it" },
        { status: 404 }
      );
    }

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
