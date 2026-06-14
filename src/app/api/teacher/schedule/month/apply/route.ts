import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const bodySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

// POST /api/teacher/schedule/month/apply
// Materialises the teacher's recurring odd/even schedule slots into concrete
// lesson sessions for the given month. Sundays are skipped. Days that already
// have a lesson for a slot (including ones the teacher cancelled) are left
// untouched, so the action is safe to run more than once.
export async function POST(request: Request) {
  try {
    const user = await requireTeacher();
    const teacherId = (user as any).id as string;
    const branchId = (user as any).branchId ?? null;

    const { year, month } = bodySchema.parse(await request.json());

    const slots = await prisma.scheduleSlot.findMany({
      where: { teacherId, active: true },
      select: {
        id: true,
        dayType: true,
        title: true,
        timeSlot: true,
        classId: true,
        hourlyRate: true,
      },
    });

    if (slots.length === 0) {
      return NextResponse.json({
        message: "No schedules to apply",
        created: 0,
      });
    }

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    // Already-materialised slot occurrences this month (any status), so we don't
    // duplicate lessons or resurrect ones the teacher removed for a single day.
    const existing = await prisma.lessonSession.findMany({
      where: {
        teacherId,
        scheduleSlotId: { not: null },
        date: { gte: start, lt: end },
      },
      select: { scheduleSlotId: true, date: true },
    });
    const takenKey = (slotId: string, day: number) => `${slotId}:${day}`;
    const taken = new Set(
      existing.map((l) => takenKey(l.scheduleSlotId!, l.date.getUTCDate()))
    );

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    const toCreate: {
      teacherId: string;
      branchId: string | null;
      classId: string | null;
      scheduleSlotId: string;
      title: string;
      date: Date;
      timeSlot: string;
      hourlyRate: typeof slots[number]["hourlyRate"];
    }[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateUtc = new Date(Date.UTC(year, month - 1, day));
      if (dateUtc.getUTCDay() === 0) continue; // skip Sundays

      const wantType = day % 2 !== 0 ? "ODD" : "EVEN";
      for (const slot of slots) {
        if (slot.dayType !== wantType) continue;
        if (taken.has(takenKey(slot.id, day))) continue;
        toCreate.push({
          teacherId,
          branchId,
          classId: slot.classId,
          scheduleSlotId: slot.id,
          title: slot.title,
          date: dateUtc,
          timeSlot: slot.timeSlot,
          hourlyRate: slot.hourlyRate,
        });
      }
    }

    if (toCreate.length === 0) {
      return NextResponse.json({
        message: "This month is already up to date",
        created: 0,
      });
    }

    const result = await prisma.lessonSession.createMany({ data: toCreate });

    return NextResponse.json({
      message: "Schedule applied to month",
      created: result.count,
    });
  } catch (error) {
    return handleApiError(error, "Apply monthly schedule error");
  }
}
