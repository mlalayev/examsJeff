import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

// Returns exams assigned to the logged-in student based on Bookings
export async function GET(request: Request) {
  try {
    const user = await requireStudent();
    const studentId = (user as any).id as string;

    const bookings = await prisma.booking.findMany({
      where: {
        studentId,
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
      },
      orderBy: { startAt: "desc" },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            category: true,
            track: true,
          },
        },
      },
    });

    const exams = bookings.map((b) => ({
      id: b.id, // booking id
      examId: b.examId,
      title: b.exam.title,
      category: b.exam.category,
      track: b.exam.track,
      sections: b.sections,
      startAt: b.startAt,
      dueAt: null as any, // not tracked on booking
      createdAt: b.createdAt,
    }));

    return NextResponse.json({ exams });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isForbidden = message.toLowerCase().includes("forbidden") || message.toLowerCase().includes("unauthorized");
    if (isForbidden) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    console.error("Student exams list error:", error);
    return NextResponse.json({ error: "Failed to list student exams" }, { status: 500 });
  }
}
