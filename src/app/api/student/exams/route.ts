import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await requireStudent();
    const studentId = (user as any).id as string;

    // Fetch bookings/assignments for student that do not have SUBMITTED attempts
    const bookings = await prisma.booking.findMany({
      where: {
        studentId,
        OR: [
          { attempt: null },
          { attempt: { status: { not: "SUBMITTED" } } },
        ],
      },
      include: {
        exam: true,
        teacher: { select: { id: true, name: true } },
        attempt: { select: { id: true, status: true } },
      },
      orderBy: { startAt: "asc" },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Student exams list error:", error);
    return NextResponse.json({ error: "Failed to load exams" }, { status: 500 });
  }
}
