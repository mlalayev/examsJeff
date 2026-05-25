import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireStudent();
    const studentId = (user as any).id as string;

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "regular").toLowerCase();
    const isExtra = type === "extras";

    const items = await prisma.assignment.findMany({
      where: { studentId, isExtra },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        status: true,
        startAt: true,
        dueAt: true,
        createdAt: true,
        isExtra: true,
        unitExam: {
          select: {
            id: true,
            exam: {
              select: {
                id: true,
                title: true,
                category: true,
                track: true,
                durationMin: true,
              },
            },
            unit: { select: { id: true, title: true, order: true } },
          },
        },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        attempt: { select: { id: true, status: true, bandOverall: true } },
      },
    });

    const result = items.map((a) => ({
      id: a.id,
      status: a.status,
      startAt: a.startAt,
      dueAt: a.dueAt,
      createdAt: a.createdAt,
      isExtra: a.isExtra,
      exam: a.unitExam.exam,
      unit: a.unitExam.unit,
      teacher: a.teacher
        ? {
            id: a.teacher.id,
            name:
              [a.teacher.firstName, a.teacher.lastName]
                .filter(Boolean)
                .join(" ")
                .trim() || null,
          }
        : null,
      attempt: a.attempt,
    }));

    return NextResponse.json({ items: result });
  } catch (error: any) {
    const status = /Unauthorized|Forbidden/.test(error?.message ?? "") ? 401 : 500;
    console.error("Student homework list error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to load homework" },
      { status }
    );
  }
}
