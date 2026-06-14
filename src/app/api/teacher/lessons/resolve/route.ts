import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const resolveSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
    scheduleSlotId: z.string().min(1).optional(),
    lessonId: z.string().min(1).optional(),
  })
  .refine((d) => d.scheduleSlotId || d.lessonId, {
    message: "Either scheduleSlotId or lessonId is required",
  });

function toUtcDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// POST /api/teacher/lessons/resolve
// Resolves a concrete lesson session for a given date so attendance/feedback
// can be saved. If a recurring schedule slot is clicked for a date that has no
// lesson yet, a LessonSession is materialised from the slot. Returns the lesson
// together with the class roster and any existing student records.
export async function POST(request: Request) {
  try {
    const user = await requireTeacher();
    const teacherId = (user as any).id as string;
    const body = await request.json();
    const { date, scheduleSlotId, lessonId } = resolveSchema.parse(body);

    let lessonRow:
      | { id: string; classId: string | null }
      | null = null;

    if (lessonId) {
      const lesson = await prisma.lessonSession.findFirst({
        where: { id: lessonId, teacherId },
        select: { id: true, classId: true },
      });
      if (!lesson) {
        return NextResponse.json(
          { error: "Lesson not found or you don't have permission to view it" },
          { status: 404 }
        );
      }
      lessonRow = lesson;
    } else if (scheduleSlotId) {
      const slot = await prisma.scheduleSlot.findFirst({
        where: { id: scheduleSlotId, teacherId },
        select: {
          id: true,
          title: true,
          timeSlot: true,
          classId: true,
          hourlyRate: true,
        },
      });
      if (!slot) {
        return NextResponse.json(
          {
            error:
              "Schedule slot not found or you don't have permission to use it",
          },
          { status: 404 }
        );
      }

      const dateUtc = toUtcDate(date);

      // Reuse an existing materialised lesson for this date+slot if present
      const existing = await prisma.lessonSession.findFirst({
        where: { teacherId, scheduleSlotId: slot.id, date: dateUtc },
        select: { id: true, classId: true },
      });

      lessonRow =
        existing ??
        (await prisma.lessonSession.create({
          data: {
            teacherId,
            branchId: (user as any).branchId ?? null,
            classId: slot.classId,
            scheduleSlotId: slot.id,
            title: slot.title,
            date: dateUtc,
            timeSlot: slot.timeSlot,
            hourlyRate: slot.hourlyRate,
          },
          select: { id: true, classId: true },
        }));
    }

    if (!lessonRow) {
      return NextResponse.json({ error: "Unable to resolve lesson" }, { status: 400 });
    }

    // Full lesson detail
    const lesson = await prisma.lessonSession.findUnique({
      where: { id: lessonRow.id },
      include: { class: { select: { id: true, name: true } } },
    });

    // Class roster (students enrolled in the lesson's class)
    const roster = lessonRow.classId
      ? await prisma.classStudent.findMany({
          where: { classId: lessonRow.classId },
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: "asc" },
        })
      : [];

    const students = roster.map((r) => ({
      id: r.student.id,
      email: r.student.email,
      name:
        [r.student.firstName, r.student.lastName].filter(Boolean).join(" ").trim() ||
        r.student.email,
    }));

    // Existing saved records for this lesson
    const records = await prisma.lessonStudentRecord.findMany({
      where: { lessonSessionId: lessonRow.id },
    });

    return NextResponse.json({ lesson, students, records });
  } catch (error) {
    return handleApiError(error, "Resolve lesson error");
  }
}
