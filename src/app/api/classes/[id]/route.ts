import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { classAccessWhere } from "@/lib/class-access";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const updateClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100, "Class name is too long"),
});

async function findAccessibleClass(classId: string, user: any) {
  return prisma.class.findFirst({
    where: {
      id: classId,
      ...classAccessWhere({
        id: user.id,
        role: user.role,
        branchId: user.branchId,
      }),
    },
  });
}

// GET /api/classes/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireTeacher();
    const { id: classId } = await params;

    const cls = await prisma.class.findFirst({
      where: {
        id: classId,
        ...classAccessWhere({
          id: (user as any).id,
          role: (user as any).role,
          branchId: (user as any).branchId,
        }),
      },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { classStudents: true } },
      },
    });

    if (!cls) {
      return NextResponse.json(
        { error: "Class not found or you don't have permission to view it" },
        { status: 404 }
      );
    }

    return NextResponse.json({ class: cls });
  } catch (error) {
    return handleApiError(error, "Get class error");
  }
}

// PATCH /api/classes/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireTeacher();
    const { id: classId } = await params;
    const body = await request.json();
    const validatedData = updateClassSchema.parse(body);

    const existing = await findAccessibleClass(classId, user as any);
    if (!existing) {
      return NextResponse.json(
        { error: "Class not found or you don't have permission to modify it" },
        { status: 404 }
      );
    }

    const updated = await prisma.class.update({
      where: { id: classId },
      data: { name: validatedData.name },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { classStudents: true } },
      },
    });

    return NextResponse.json({
      message: "Class updated successfully",
      class: updated,
    });
  } catch (error) {
    return handleApiError(error, "Update class error");
  }
}

// DELETE /api/classes/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireTeacher();
    const { id: classId } = await params;

    const existing = await findAccessibleClass(classId, user as any);
    if (!existing) {
      return NextResponse.json(
        { error: "Class not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    await prisma.class.delete({ where: { id: classId } });

    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (error) {
    return handleApiError(error, "Delete class error");
  }
}
