import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const updateSlotSchema = z
  .object({
    dayType: z.enum(["ODD", "EVEN"]).optional(),
    title: z.string().min(1).max(120).optional(),
    timeSlot: z.string().min(1).max(40).optional(),
    classId: z.string().min(1).nullable().optional(),
    hourlyRate: z.number().nonnegative().nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "No fields provided to update",
  });

// PATCH /api/teacher/schedule/slots/[slotId] - Update a recurring slot
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const user = await requireTeacher();
    const { slotId } = await params;
    const body = await request.json();
    const data = updateSlotSchema.parse(body);

    // Ownership check
    const existing = await prisma.scheduleSlot.findFirst({
      where: { id: slotId, teacherId: (user as any).id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Schedule slot not found or you don't have permission to modify it" },
        { status: 404 }
      );
    }

    // If reassigning a class, it must belong to this teacher
    if (data.classId) {
      const owned = await prisma.class.findFirst({
        where: { id: data.classId, teacherId: (user as any).id },
        select: { id: true },
      });
      if (!owned) {
        return NextResponse.json(
          { error: "Class not found or you don't have permission to use it" },
          { status: 404 }
        );
      }
    }

    const slot = await prisma.scheduleSlot.update({
      where: { id: slotId },
      data: {
        ...(data.dayType !== undefined ? { dayType: data.dayType } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.timeSlot !== undefined ? { timeSlot: data.timeSlot } : {}),
        ...(data.classId !== undefined ? { classId: data.classId } : {}),
        ...(data.hourlyRate !== undefined ? { hourlyRate: data.hourlyRate } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
      include: {
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ message: "Schedule slot updated", slot });
  } catch (error) {
    return handleApiError(error, "Update schedule slot error");
  }
}

// DELETE /api/teacher/schedule/slots/[slotId] - Delete a recurring slot
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const user = await requireTeacher();
    const { slotId } = await params;

    const existing = await prisma.scheduleSlot.findFirst({
      where: { id: slotId, teacherId: (user as any).id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Schedule slot not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    await prisma.scheduleSlot.delete({ where: { id: slotId } });

    return NextResponse.json({ message: "Schedule slot deleted" });
  } catch (error) {
    return handleApiError(error, "Delete schedule slot error");
  }
}
