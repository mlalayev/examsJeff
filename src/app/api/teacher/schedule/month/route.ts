import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

// GET /api/teacher/schedule/month?year=2026&month=6
// Returns the teacher's recurring odd/even slots plus all concrete lesson
// sessions within the requested month (UTC), so the calendar can be composed.
export async function GET(request: Request) {
  try {
    const user = await requireTeacher();
    const { searchParams } = new URL(request.url);
    const { year, month } = querySchema.parse({
      year: searchParams.get("year"),
      month: searchParams.get("month"),
    });

    // Month range [first day, first day of next month)
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const [slots, lessons] = await Promise.all([
      prisma.scheduleSlot.findMany({
        where: { teacherId: (user as any).id, active: true },
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
          teacherId: (user as any).id,
          date: { gte: start, lt: end },
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              _count: { select: { classStudents: true } },
            },
          },
          _count: { select: { studentRecords: true } },
        },
        orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
      }),
    ]);

    return NextResponse.json({
      year,
      month,
      oddDays: slots.filter((s) => s.dayType === "ODD"),
      evenDays: slots.filter((s) => s.dayType === "EVEN"),
      lessons,
    });
  } catch (error) {
    return handleApiError(error, "Get monthly schedule error");
  }
}
