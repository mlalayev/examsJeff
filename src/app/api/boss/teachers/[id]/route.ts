import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBoss } from "@/lib/auth-utils";

// GET /api/boss/teachers/[id] - Teacher account details + full schedule
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireBoss();
    const { id } = await params;

    const teacher = await prisma.user.findFirst({
      where: { id, role: "TEACHER" },
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
            dateOfBirth: true,
            program: true,
            schedule: true,
          },
        },
        classesTeaching: {
          select: {
            id: true,
            name: true,
            _count: { select: { classStudents: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const schedule = (teacher.teacherProfile?.schedule as any) || {
      oddDays: [],
      evenDays: [],
      dayOverrides: {},
    };

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        approved: teacher.approved,
        createdAt: teacher.createdAt,
        branch: teacher.branch,
        phoneNumber: teacher.teacherProfile?.phoneNumber || null,
        dateOfBirth: teacher.teacherProfile?.dateOfBirth || null,
        program: teacher.teacherProfile?.program || null,
        classes: teacher.classesTeaching.map((c) => ({
          id: c.id,
          name: c.name,
          students: c._count.classStudents,
        })),
      },
      schedule,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Boss teacher detail error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
