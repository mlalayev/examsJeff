import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

// GET /api/teacher/schedule/month/report?year=2026&month=6
// Returns one row per class that had at least one lesson this month, with the
// class roster and how many lessons (sessions) it had. The client groups this
// by lesson type and roster size to build the shareable summary.
export async function GET(request: Request) {
  try {
    const user = await requireTeacher();
    const teacherId = (user as any).id as string;
    const { searchParams } = new URL(request.url);
    const { year, month } = querySchema.parse({
      year: searchParams.get("year"),
      month: searchParams.get("month"),
    });

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const lessons = await prisma.lessonSession.findMany({
      where: {
        teacherId,
        status: { not: "CANCELLED" },
        classId: { not: null },
        date: { gte: start, lt: end },
      },
      select: { classId: true },
    });

    // lesson count per class
    const countByClass = new Map<string, number>();
    for (const l of lessons) {
      if (!l.classId) continue;
      countByClass.set(l.classId, (countByClass.get(l.classId) ?? 0) + 1);
    }

    const classIds = [...countByClass.keys()];
    if (classIds.length === 0) {
      return NextResponse.json({ classes: [] });
    }

    const classes = await prisma.class.findMany({
      where: { id: { in: classIds } },
      select: {
        id: true,
        name: true,
        classStudents: {
          select: {
            student: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const nameOf = (s: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    }) => s.firstName?.trim() || s.lastName?.trim() || s.email.split("@")[0];

    const result = classes.map((c) => ({
      id: c.id,
      name: c.name,
      students: c.classStudents.map((cs) => nameOf(cs.student)),
      lessonCount: countByClass.get(c.id) ?? 0,
    }));

    return NextResponse.json({ year, month, classes: result });
  } catch (error) {
    return handleApiError(error, "Monthly report error");
  }
}
