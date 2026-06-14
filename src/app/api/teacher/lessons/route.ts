import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const createLessonSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  timeSlot: z.string().min(1, "Time slot is required").max(40),
  classId: z.string().min(1).optional().nullable(),
  scheduleSlotId: z.string().min(1).optional().nullable(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  hourlyRate: z.number().nonnegative().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const listQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  classId: z.string().min(1).optional(),
});

function toUtcDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// GET /api/teacher/lessons?from=&to=&classId= - List the teacher's lesson sessions
export async function GET(request: Request) {
  try {
    const user = await requireTeacher();
    const { searchParams } = new URL(request.url);
    const { from, to, classId } = listQuerySchema.parse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      classId: searchParams.get("classId") ?? undefined,
    });

    const dateFilter: { gte?: Date; lt?: Date } = {};
    if (from) dateFilter.gte = toUtcDate(from);
    if (to) dateFilter.lt = toUtcDate(to);

    const lessons = await prisma.lessonSession.findMany({
      where: {
        teacherId: (user as any).id,
        ...(classId ? { classId } : {}),
        ...(from || to ? { date: dateFilter } : {}),
      },
      include: {
        class: { select: { id: true, name: true } },
        _count: { select: { studentRecords: true } },
      },
      orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
    });

    return NextResponse.json({ lessons });
  } catch (error) {
    return handleApiError(error, "List lessons error");
  }
}

// POST /api/teacher/lessons - Create a lesson session (lesson record)
export async function POST(request: Request) {
  try {
    const user = await requireTeacher();
    const body = await request.json();
    const data = createLessonSchema.parse(body);

    // Linked class must belong to this teacher
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

    // Linked schedule slot must belong to this teacher
    if (data.scheduleSlotId) {
      const owned = await prisma.scheduleSlot.findFirst({
        where: { id: data.scheduleSlotId, teacherId: (user as any).id },
        select: { id: true },
      });
      if (!owned) {
        return NextResponse.json(
          { error: "Schedule slot not found or you don't have permission to use it" },
          { status: 404 }
        );
      }
    }

    const lesson = await prisma.lessonSession.create({
      data: {
        teacherId: (user as any).id,
        branchId: (user as any).branchId ?? null,
        classId: data.classId ?? null,
        scheduleSlotId: data.scheduleSlotId ?? null,
        title: data.title,
        date: toUtcDate(data.date),
        timeSlot: data.timeSlot,
        status: data.status ?? "SCHEDULED",
        hourlyRate: data.hourlyRate ?? null,
        notes: data.notes ?? null,
      },
      include: {
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { message: "Lesson created", lesson },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "Create lesson error");
  }
}
