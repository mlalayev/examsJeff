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
    
    // Get upcoming bookings (future exams)
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        studentId: userId,
        startAt: {
          gte: now
        },
        status: {
          in: ["CONFIRMED", "PENDING"]
        }
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            examType: true,
          }
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        attempt: {
          select: {
            id: true,
            status: true,
          }
        }
      },
      orderBy: {
        startAt: "asc"
      },
      take: 5
    });
    
    // Get recent attempts with results
    const recentAttempts = await prisma.attempt.findMany({
      where: {
        booking: {
          studentId: userId
        },
        status: "SUBMITTED"
      },
      include: {
        booking: {
          include: {
            exam: {
              select: {
                id: true,
                title: true,
                examType: true,
              }
            }
          }
        },
        sections: {
          select: {
            type: true,
            bandScore: true,
            rawScore: true,
          }
        }
      },
      orderBy: {
        submittedAt: "desc"
      },
      take: 5
    });
    
    // Calculate streak (optional - consecutive days with attempts)
    const attemptsLast30Days = await prisma.attempt.findMany({
      where: {
        booking: {
          studentId: userId
        },
        status: "SUBMITTED",
        submittedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        submittedAt: true
      },
      orderBy: {
        submittedAt: "desc"
      }
    });
    
    // Simple streak calculation (days with at least one attempt)
    const uniqueDays = new Set(
      attemptsLast30Days
        .filter(a => a.submittedAt)
        .map(a => new Date(a.submittedAt!).toDateString())
    );
    
    const streak = uniqueDays.size;
    
    // Get total stats
    const totalAttempts = await prisma.attempt.count({
      where: {
        booking: {
          studentId: userId
        },
        status: "SUBMITTED"
      }
    });
    
    const avgBand = await prisma.attempt.aggregate({
      where: {
        booking: {
          studentId: userId
        },
        status: "SUBMITTED",
        bandOverall: {
          not: null
        }
      },
      _avg: {
        bandOverall: true
      }
    });
    
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

