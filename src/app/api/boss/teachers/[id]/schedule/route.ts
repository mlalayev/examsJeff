import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBoss } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import { parseLessonHours } from "@/lib/lesson-time";
import { z } from "zod";

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

// GET /api/boss/teachers/[id]/schedule?year=2026&month=6
// Recurring odd/even schedule slots + materialised lessons for the month.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireBoss();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const { year, month } = querySchema.parse({
      year: searchParams.get("year"),
      month: searchParams.get("month"),
    });

    const teacher = await prisma.user.findFirst({
      where: { id, role: "TEACHER" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        branch: { select: { id: true, name: true } },
      },
    });
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const [slots, lessons, classes] = await Promise.all([
      prisma.scheduleSlot.findMany({
        where: { teacherId: id, active: true },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              _count: { select: { classStudents: true } },
            },
          },
        },
        orderBy: [{ dayType: "asc" }, { timeSlot: "asc" }],
      }),
      prisma.lessonSession.findMany({
        where: {
          teacherId: id,
          status: { not: "CANCELLED" },
          date: { gte: start, lt: end },
        },
        select: {
          id: true,
          title: true,
          date: true,
          timeSlot: true,
          topic: true,
          status: true,
          class: { select: { id: true, name: true } },
          _count: { select: { studentRecords: true } },
        },
        orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
      }),
      prisma.class.findMany({
        where: { teacherId: id },
        select: {
          id: true,
          name: true,
          _count: { select: { classStudents: true } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    const name =
      [teacher.firstName, teacher.lastName].filter(Boolean).join(" ").trim() ||
      teacher.email;

    return NextResponse.json({
      year,
      month,
      teacher: { id: teacher.id, name, email: teacher.email, branch: teacher.branch },
      recurring: {
        oddDays: slots
          .filter((s) => s.dayType === "ODD")
          .map((s) => ({
            id: s.id,
            title: s.title,
            timeSlot: s.timeSlot,
            className: s.class?.name ?? null,
            studentCount: s.class?._count.classStudents ?? 0,
            hourlyRate: s.hourlyRate != null ? Number(s.hourlyRate) : null,
          })),
        evenDays: slots
          .filter((s) => s.dayType === "EVEN")
          .map((s) => ({
            id: s.id,
            title: s.title,
            timeSlot: s.timeSlot,
            className: s.class?.name ?? null,
            studentCount: s.class?._count.classStudents ?? 0,
            hourlyRate: s.hourlyRate != null ? Number(s.hourlyRate) : null,
          })),
      },
      classes: classes.map((c) => ({
        id: c.id,
        name: c.name,
        studentCount: c._count.classStudents,
      })),
      lessons: lessons.map((l) => ({
        id: l.id,
        title: l.title,
        date: l.date.toISOString().slice(0, 10),
        timeSlot: l.timeSlot,
        hours: Math.round(parseLessonHours(l.timeSlot) * 100) / 100,
        topic: l.topic,
        status: l.status,
        className: l.class?.name ?? null,
        studentRecordCount: l._count.studentRecords,
      })),
    });
  } catch (error) {
    return handleApiError(error, "Boss teacher schedule error");
  }
}
