import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

// GET /api/me/assignments - student's upcoming + open assignments
export async function GET() {
  try {
    const user = await requireStudent();
    if ((user as any).role === "STUDENT" && !(user as any).approved) {
      return NextResponse.json({ error: "Approval required" }, { status: 403 });
    }

    const now = new Date();
    const assignments = await prisma.assignment.findMany({
      where: {
        studentId: (user as any).id,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        OR: [
          { startAt: null },
          { startAt: { lte: now } },
        ],
        OR2: [
          { dueAt: null },
          { dueAt: { gte: now } },
        ] as any,
      },
      orderBy: { createdAt: "desc" },
      include: {
        unitExam: {
          include: {
            exam: { select: { id: true, title: true, examType: true } },
            unit: { select: { id: true, title: true } },
          }
        }
      }
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    if (error instanceof Error && (error.message.includes("Unauthorized") || error.message.includes("Forbidden"))) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}


