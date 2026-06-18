import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBoss } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import { parseLessonHours } from "@/lib/lesson-time";
import { computeTeacherPay } from "@/lib/teacher-salary";
import {
  projectedHoursForMonth,
  projectedLessonsForMonth,
} from "@/lib/schedule-project";
import { z } from "zod";

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

// GET /api/boss/salary?year=2026&month=6
// Monthly salary overview: lessons, hours, pay settings, estimated pay per teacher.
export async function GET(request: Request) {
  try {
    await requireBoss();
    const { searchParams } = new URL(request.url);
    const { year, month } = querySchema.parse({
      year: searchParams.get("year"),
      month: searchParams.get("month"),
    });

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const [teachers, paySettings, lessons, allSlots] = await Promise.all([
      prisma.user.findMany({
        where: { role: "TEACHER" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          approved: true,
          branch: { select: { id: true, name: true } },
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      }),
      prisma.teacherPaySetting.findMany(),
      prisma.lessonSession.findMany({
        where: {
          status: { not: "CANCELLED" },
          date: { gte: start, lt: end },
        },
        select: {
          teacherId: true,
          timeSlot: true,
          studentRecords: { select: { studentId: true } },
        },
      }),
      prisma.scheduleSlot.findMany({
        where: { active: true },
        select: { teacherId: true, dayType: true, timeSlot: true },
      }),
    ]);

    const payByTeacher = new Map(paySettings.map((p) => [p.teacherId, p]));

    const slotsByTeacher = new Map<string, { dayType: "ODD" | "EVEN"; timeSlot: string }[]>();
    for (const s of allSlots) {
      const list = slotsByTeacher.get(s.teacherId) ?? [];
      list.push({ dayType: s.dayType, timeSlot: s.timeSlot });
      slotsByTeacher.set(s.teacherId, list);
    }

    type Agg = { lessons: number; hours: number; students: Set<string> };
    const aggByTeacher = new Map<string, Agg>();

    for (const l of lessons) {
      const agg = aggByTeacher.get(l.teacherId) ?? {
        lessons: 0,
        hours: 0,
        students: new Set<string>(),
      };
      agg.lessons += 1;
      agg.hours += parseLessonHours(l.timeSlot);
      for (const r of l.studentRecords) agg.students.add(r.studentId);
      aggByTeacher.set(l.teacherId, agg);
    }

    const rows = teachers.map((t) => {
      const agg = aggByTeacher.get(t.id) ?? {
        lessons: 0,
        hours: 0,
        students: new Set<string>(),
      };
      const pay = payByTeacher.get(t.id);
      const setting = {
        payType: pay?.payType ?? ("PER_LESSON" as const),
        rate: pay?.rate != null ? Number(pay.rate) : null,
        fixedAmount:
          pay?.fixedAmount != null ? Number(pay.fixedAmount) : null,
      };
      const name =
        [t.firstName, t.lastName].filter(Boolean).join(" ").trim() ||
        t.email.split("@")[0];

      const teacherSlots = slotsByTeacher.get(t.id) ?? [];
      const projectedLessons = projectedLessonsForMonth(
        teacherSlots,
        year,
        month
      );
      const projectedHours = projectedHoursForMonth(teacherSlots, year, month);

      // Pay from actual held lessons; if none yet but schedule exists, show
      // projected estimate so boss can plan before teacher applies the month.
      const lessonsForPay =
        agg.lessons > 0 ? agg.lessons : projectedLessons;
      const hoursForPay = agg.hours > 0 ? agg.hours : projectedHours;

      return {
        id: t.id,
        name,
        email: t.email,
        approved: t.approved,
        branch: t.branch,
        recurringSlotCount: teacherSlots.length,
        lessonCount: agg.lessons,
        projectedLessons,
        totalHours: Math.round(agg.hours * 100) / 100,
        projectedHours,
        studentCount: agg.students.size,
        payType: setting.payType,
        rate: setting.rate,
        fixedAmount: setting.fixedAmount,
        estimatedPay: computeTeacherPay(
          setting,
          lessonsForPay,
          hoursForPay
        ),
        payBasedOnActual: agg.lessons > 0,
      };
    });

    const totals = rows.reduce(
      (acc, r) => ({
        lessons: acc.lessons + r.lessonCount,
        hours: acc.hours + r.totalHours,
        pay: acc.pay + (r.estimatedPay ?? 0),
      }),
      { lessons: 0, hours: 0, pay: 0 }
    );

    return NextResponse.json({
      year,
      month,
      teachers: rows,
      totals: {
        lessons: totals.lessons,
        hours: Math.round(totals.hours * 100) / 100,
        estimatedPay: Math.round(totals.pay * 100) / 100,
      },
    });
  } catch (error) {
    return handleApiError(error, "Boss salary overview error");
  }
}
