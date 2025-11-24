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

export async function DELETE(request: Request) {
  try {
    const user = await requireStudent();
    const studentId = (user as any).id as string;
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        studentId,
        OR: [
          { attempt: null },
          { attempt: { status: { not: "SUBMITTED" } } },
        ],
      },
      select: {
        id: true,
        attempt: { select: { id: true, status: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (booking.attempt && booking.attempt.status === "IN_PROGRESS") {
      return NextResponse.json({ error: "You must finish or cancel the attempt before deleting this exam" }, { status: 409 });
    }

    await prisma.booking.delete({
      where: { id: bookingId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Student exam delete error:", error);
    return NextResponse.json({ error: "Failed to delete exam" }, { status: 500 });
  }
}
