import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBranchAdmin, getScopedBranchId } from "@/lib/auth-utils";
import { z } from "zod";

const assignTeacherSchema = z.object({
  teacherId: z.string().nullable(),
});

// PATCH /api/branch/students/:studentId/assign-teacher - Assign teacher to student
export async function PATCH(
  request: Request,
  { params }: { params: { studentId: string } }
) {
  try {
    const user = await requireBranchAdmin();
    const branchId = getScopedBranchId(user);
    const { studentId } = params;

    const body = await request.json();
    const validatedData = assignTeacherSchema.parse(body);

    // Verify student exists and is in the same branch
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true, branchId: true },
    });

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Enforce branch scoping (only for BRANCH_ADMIN, BOSS can assign any)
    if (branchId && student.branchId !== branchId) {
      return NextResponse.json({ error: "Student is not in your branch" }, { status: 403 });
    }

    if (!student.branchId) {
      return NextResponse.json({ error: "Student must be assigned to a branch first" }, { status: 400 });
    }

    // If assigning a teacher, validate the teacher
    if (validatedData.teacherId) {
      const teacher = await prisma.user.findUnique({
        where: { id: validatedData.teacherId },
        select: { id: true, role: true, branchId: true },
      });

      if (!teacher || teacher.role !== "TEACHER") {
        return NextResponse.json({ error: "Invalid teacher" }, { status: 400 });
      }

      // Teacher must be in the same branch as the student
      if (teacher.branchId !== student.branchId) {
        return NextResponse.json({ 
          error: "Teacher must be in the same branch as the student" 
        }, { status: 400 });
      }
    }

    // Upsert student profile with teacher assignment
    const profile = await prisma.studentProfile.upsert({
      where: { studentId: studentId },
      create: {
        studentId: studentId,
        branchId: student.branchId,
        teacherId: validatedData.teacherId,
      },
      update: {
        teacherId: validatedData.teacherId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      message: "Teacher assigned successfully", 
      profile 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: error.errors 
      }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Assign teacher error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
