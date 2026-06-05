import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBoss } from "@/lib/auth-utils";

// GET /api/boss/teachers - List all teacher accounts with profile + branch info
export async function GET(request: Request) {
  try {
    await requireBoss();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const branchId = searchParams.get("branchId");

    const teachers = await prisma.user.findMany({
      where: {
        role: "TEACHER",
        ...(branchId ? { branchId } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        approved: true,
        createdAt: true,
        branch: { select: { id: true, name: true } },
        teacherProfile: {
          select: {
            phoneNumber: true,
            program: true,
            schedule: true,
          },
        },
        _count: {
          select: {
            classesTeaching: true,
            studentsTeaching: true,
          },
        },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    // Compute a lightweight count of recurring lessons (odd + even base lessons)
    // so the list can show how busy each teacher is without sending full schedules.
    const rows = teachers.map((t) => {
      const schedule = (t.teacherProfile?.schedule as any) || {};
      const oddCount = Array.isArray(schedule.oddDays) ? schedule.oddDays.length : 0;
      const evenCount = Array.isArray(schedule.evenDays) ? schedule.evenDays.length : 0;
      return {
        id: t.id,
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        approved: t.approved,
        createdAt: t.createdAt,
        branch: t.branch,
        phoneNumber: t.teacherProfile?.phoneNumber || null,
        program: t.teacherProfile?.program || null,
        hasSchedule: oddCount + evenCount > 0,
        recurringLessons: oddCount + evenCount,
        classes: t._count.classesTeaching,
        students: t._count.studentsTeaching,
      };
    });

    return NextResponse.json({ teachers: rows });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Boss teachers list error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
