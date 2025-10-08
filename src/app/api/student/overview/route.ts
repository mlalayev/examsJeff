import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/student/overview - Student dashboard overview data
export async function GET() {
  try {
    const user = await requireAuth();
    const userId = (user as any).id;
    const role = (user as any).role;
    
    if (role !== "STUDENT") {
      return NextResponse.json(
        { error: "Students only" },
        { status: 403 }
      );
    }
    
    const now = new Date();

    const [upcomingBookings, recentAttempts, attemptsLast30Days, totalAttempts, avgBand] = await Promise.all([
      // Upcoming bookings
      prisma.booking.findMany({
        where: {
          studentId: userId,
          startAt: { gte: now },
          status: { in: ["CONFIRMED", "PENDING"] },
        },
        select: {
          id: true,
          startAt: true,
          sections: true,
          status: true,
          exam: { select: { id: true, title: true, examType: true } },
          teacher: { select: { id: true, name: true, email: true } },
          attempt: { select: { id: true, status: true } },
        },
        orderBy: { startAt: "asc" },
        take: 5,
      }),

      // Recent attempts
      prisma.attempt.findMany({
        where: {
          booking: { studentId: userId },
          status: "SUBMITTED",
        },
        select: {
          id: true,
          bandOverall: true,
          submittedAt: true,
          booking: { select: { exam: { select: { id: true, title: true, examType: true } } } },
          sections: { select: { type: true, bandScore: true, rawScore: true } },
        },
        orderBy: { submittedAt: "desc" },
        take: 5,
      }),

      // Attempts for streak in last 30 days
      prisma.attempt.findMany({
        where: {
          booking: { studentId: userId },
          status: "SUBMITTED",
          submittedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: { submittedAt: true },
        orderBy: { submittedAt: "desc" },
      }),

      prisma.attempt.count({
        where: { booking: { studentId: userId }, status: "SUBMITTED" },
      }),

      prisma.attempt.aggregate({
        where: {
          booking: { studentId: userId },
          status: "SUBMITTED",
          bandOverall: { not: null },
        },
        _avg: { bandOverall: true },
      }),
    ]);

    const uniqueDays = new Set(
      attemptsLast30Days
        .filter(a => a.submittedAt)
        .map(a => new Date(a.submittedAt!).toDateString())
    );
    const streak = uniqueDays.size;
    
    return NextResponse.json({
      upcomingBookings: upcomingBookings.map(b => ({
        id: b.id,
        startAt: b.startAt,
        sections: b.sections,
        status: b.status,
        exam: b.exam,
        teacher: b.teacher,
        hasAttempt: !!b.attempt,
        attemptId: b.attempt?.id,
      })),
      recentAttempts: recentAttempts.map(a => ({
        id: a.id,
        bandOverall: a.bandOverall,
        submittedAt: a.submittedAt,
        exam: a.booking.exam,
        sections: a.sections,
      })),
      stats: {
        totalAttempts,
        averageBand: avgBand._avg.bandOverall ? Number(avgBand._avg.bandOverall.toFixed(1)) : null,
        streak,
        upcomingCount: upcomingBookings.length,
      }
    });
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    
    console.error("Student overview error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching overview" },
      { status: 500 }
    );
  }
}

