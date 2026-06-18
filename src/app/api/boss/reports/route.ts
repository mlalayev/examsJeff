import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBoss } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const querySchema = z.object({
  teacherId: z.string().min(1).optional(),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

function isoWeekLabel(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt(weekStart)} – ${fmt(end)}, ${weekStart.getUTCFullYear()}`;
}

// GET /api/boss/reports?teacherId=&year=2026&month=6
// Returns stored weekly AI reports grouped by week for the selected teacher/month.
export async function GET(request: Request) {
  try {
    await requireBoss();
    const { searchParams } = new URL(request.url);
    const { teacherId, year, month } = querySchema.parse({
      teacherId: searchParams.get("teacherId") ?? undefined,
      year: searchParams.get("year"),
      month: searchParams.get("month"),
    });

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const reports = await prisma.weeklyReport.findMany({
      where: {
        ...(teacherId ? { teacherId } : {}),
        weekStart: { gte: start, lt: end },
      },
      orderBy: [
        { weekStart: "asc" },
        { subject: "asc" },
        { studentName: "asc" },
      ],
    });

    const teacherIds = [...new Set(reports.map((r) => r.teacherId))];
    const teachers =
      teacherIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: teacherIds } },
            select: { id: true, firstName: true, lastName: true, email: true },
          })
        : [];
    const teacherName = new Map(
      teachers.map((t) => [
        t.id,
        [t.firstName, t.lastName].filter(Boolean).join(" ").trim() || t.email,
      ])
    );

    type WeekGroup = {
      weekStart: string;
      weekLabel: string;
      reports: {
        id: string;
        teacherId: string;
        teacherName: string;
        studentId: string;
        studentName: string;
        subject: string;
        text: string;
        createdAt: string;
      }[];
    };

    const byWeek = new Map<string, WeekGroup>();
    for (const r of reports) {
      const key = r.weekStart.toISOString().slice(0, 10);
      const group =
        byWeek.get(key) ??
        ({
          weekStart: key,
          weekLabel: isoWeekLabel(r.weekStart),
          reports: [],
        } as WeekGroup);
      group.reports.push({
        id: r.id,
        teacherId: r.teacherId,
        teacherName: teacherName.get(r.teacherId) ?? "",
        studentId: r.studentId,
        studentName: r.studentName,
        subject: r.subject,
        text: r.text,
        createdAt: r.createdAt.toISOString(),
      });
      byWeek.set(key, group);
    }

    const weeks = [...byWeek.values()].sort((a, b) =>
      a.weekStart.localeCompare(b.weekStart)
    );

    // All teachers (for filter dropdown) who have any reports ever or teach
    const allTeachers = await prisma.user.findMany({
      where: { role: "TEACHER" },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return NextResponse.json({
      year,
      month,
      weeks,
      teachers: allTeachers.map((t) => ({
        id: t.id,
        name:
          [t.firstName, t.lastName].filter(Boolean).join(" ").trim() || t.email,
      })),
    });
  } catch (error) {
    return handleApiError(error, "Boss reports error");
  }
}
