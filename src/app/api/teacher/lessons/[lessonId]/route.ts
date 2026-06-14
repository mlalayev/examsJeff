import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const updateLessonSchema = z
  .object({
    title: z.string().min(1).max(120).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD").optional(),
    timeSlot: z.string().min(1).max(40).optional(),
    classId: z.string().min(1).nullable().optional(),
    status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
    hourlyRate: z.number().nonnegative().nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "No fields provided to update",
  });

function toUtcDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// GET /api/teacher/lessons/[lessonId] - Get a lesson with its student records
export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const user = await requireTeacher();
    const { lessonId } = await params;

    const lesson = await prisma.lessonSession.findFirst({
      where: { id: lessonId, teacherId: (user as any).id },
      include: {
        class: { select: { id: true, name: true } },
        studentRecords: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found or you don't have permission to view it" },
        { status: 404 }
      );
    }

    return NextResponse.json({ lesson });
  } catch (error) {
    return handleApiError(error, "Get lesson error");
  }
}

// PATCH /api/teacher/lessons/[lessonId] - Update a lesson session
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const user = await requireTeacher();
    const { lessonId } = await params;
    const body = await request.json();
    const data = updateLessonSchema.parse(body);

    const existing = await prisma.lessonSession.findFirst({
      where: { id: lessonId, teacherId: (user as any).id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Lesson not found or you don't have permission to modify it" },
        { status: 404 }
      );
    }

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

    const lesson = await prisma.lessonSession.update({
      where: { id: lessonId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.date !== undefined ? { date: toUtcDate(data.date) } : {}),
        ...(data.timeSlot !== undefined ? { timeSlot: data.timeSlot } : {}),
        ...(data.classId !== undefined ? { classId: data.classId } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.hourlyRate !== undefined ? { hourlyRate: data.hourlyRate } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
      include: {
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ message: "Lesson updated", lesson });
  } catch (error) {
    return handleApiError(error, "Update lesson error");
  }
}

// DELETE /api/teacher/lessons/[lessonId] - Delete a lesson session
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const user = await requireTeacher();
    const { lessonId } = await params;

    const existing = await prisma.lessonSession.findFirst({
      where: { id: lessonId, teacherId: (user as any).id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Lesson not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    await prisma.lessonSession.delete({ where: { id: lessonId } });

    return NextResponse.json({ message: "Lesson deleted" });
  } catch (error) {
    return handleApiError(error, "Delete lesson error");
  }
}
