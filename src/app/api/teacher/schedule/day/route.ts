import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

// GET /api/teacher/schedule/day?date=2026-06-14
// Returns the classes/lessons effective for a specific day:
//  - recurring slots that apply (odd/even by day-of-month, Sundays excluded)
//  - any concrete lesson sessions already created for that date
export async function GET(request: Request) {
  try {
    const user = await requireTeacher();
    const { searchParams } = new URL(request.url);
    const { date } = querySchema.parse({ date: searchParams.get("date") });

    const [y, m, d] = date.split("-").map(Number);
    const dayStart = new Date(Date.UTC(y, m - 1, d));
    const dayEnd = new Date(Date.UTC(y, m - 1, d + 1));

    const dayOfWeek = dayStart.getUTCDay(); // 0 = Sunday
    const dayOfMonth = d;
    const dayType: "ODD" | "EVEN" = dayOfMonth % 2 !== 0 ? "ODD" : "EVEN";

    // Sundays inherit no recurring slots (mirrors the calendar UI behaviour)
    const recurringSlots =
      dayOfWeek === 0
        ? []
        : await prisma.scheduleSlot.findMany({
            where: { teacherId: (user as any).id, active: true, dayType },
            include: { class: { select: { id: true, name: true } } },
            orderBy: { timeSlot: "asc" },
          });

    const lessons = await prisma.lessonSession.findMany({
      where: {
        teacherId: (user as any).id,
        date: { gte: dayStart, lt: dayEnd },
      },
      include: {
        class: { select: { id: true, name: true } },
        _count: { select: { studentRecords: true } },
      },
      orderBy: { timeSlot: "asc" },
    });

    return NextResponse.json({
      date,
      dayType: dayOfWeek === 0 ? "SUNDAY" : dayType,
      recurringSlots,
      lessons,
    });
  } catch (error) {
    return handleApiError(error, "Get day schedule error");
  }
}
