import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBranchAdmin, getScopedBranchId } from "@/lib/auth-utils";
import { z } from "zod";

const updateProfileSchema = z.object({
  firstEnrollAt: z.string().optional(),
  monthlyFee: z.number().optional(),
});

// PATCH /api/branch/students/:studentId/profile - Update student profile
export async function PATCH(
  request: Request,
  { params }: { params: { studentId: string } }
) {
  try {
    const user = await requireBranchAdmin();
    const branchId = getScopedBranchId(user);
    const { studentId } = params;

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Verify student exists and is in the same branch
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true, branchId: true },
    });

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Enforce branch scoping (only for BRANCH_ADMIN, BOSS can update any)
    if (branchId && student.branchId !== branchId) {
      return NextResponse.json({ error: "Student is not in your branch" }, { status: 403 });
    }

    if (!student.branchId) {
      return NextResponse.json({ error: "Student must be assigned to a branch first" }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {};
    if (validatedData.firstEnrollAt !== undefined) {
      updateData.firstEnrollAt = validatedData.firstEnrollAt ? new Date(validatedData.firstEnrollAt) : null;
    }
    if (validatedData.monthlyFee !== undefined) {
      updateData.monthlyFee = validatedData.monthlyFee;
    }

    // Upsert student profile
    const profile = await prisma.studentProfile.upsert({
      where: { studentId: studentId },
      create: {
        studentId: studentId,
        branchId: student.branchId,
        ...updateData,
      },
      update: updateData,
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
      message: "Profile updated successfully", 
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
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
