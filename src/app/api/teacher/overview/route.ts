import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";

// GET /api/teacher/overview - Teacher dashboard overview data
export async function GET() {
  try {
    const user = await requireTeacher();
    const teacherId = (user as any).id;
    
    const now = new Date();
    
    // Count classes
    const classesCount = await prisma.class.count({
      where: {
        teacherId
      }
    });
    
    // Count unique students across all classes
    const studentsCount = await prisma.classStudent.count({
      where: {
        class: {
          teacherId
        }
      }
    });
    
    // Get upcoming bookings
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        teacherId,
        startAt: {
          gte: now
        }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        exam: {
          select: {
            id: true,
            title: true,
            examType: true,
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
      take: 10
    });
    
    // Count pending grading (W/S sections not yet graded)
    const pendingGradingCount = await prisma.attemptSection.count({
      where: {
        type: {
          in: ["WRITING", "SPEAKING"]
        },
        bandScore: null,
        attempt: {
          status: "SUBMITTED",
          booking: {
            teacherId
          }
        }
      }
    });
    
    // Get pending grading sections (for quick list)
    const pendingGradingSections = await prisma.attemptSection.findMany({
      where: {
        type: {
          in: ["WRITING", "SPEAKING"]
        },
        bandScore: null,
        attempt: {
          status: "SUBMITTED",
          booking: {
            teacherId
          }
        }
      },
      include: {
        attempt: {
          include: {
            booking: {
              include: {
                student: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  }
                },
                exam: {
                  select: {
                    id: true,
                    title: true,
                    examType: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        attempt: {
          submittedAt: "asc"
        }
      },
      take: 5
    });
    
    // Get recent graded sections (activity)
    const recentlyGraded = await prisma.attemptSection.count({
      where: {
        type: {
          in: ["WRITING", "SPEAKING"]
        },
        gradedById: teacherId,
        attempt: {
          booking: {
            teacherId
          }
        }
      }
    });
    
    // Calculate average response time (optional)
    const gradedSections = await prisma.attemptSection.findMany({
      where: {
        type: {
          in: ["WRITING", "SPEAKING"]
        },
        gradedById: teacherId,
        bandScore: {
          not: null
        },
        attempt: {
          status: "SUBMITTED",
          submittedAt: {
            not: null
          },
          booking: {
            teacherId
          }
        }
      },
      select: {
        attempt: {
          select: {
            submittedAt: true
          }
        }
      },
      take: 20
    });
    
    // Average response time in hours (rough estimate)
    let avgResponseTime = null;
    if (gradedSections.length > 0) {
      const responseTimes = gradedSections
        .filter(s => s.attempt.submittedAt)
        .map(s => {
          const submitted = new Date(s.attempt.submittedAt!);
          const graded = now; // Approximation - we don't store grading time
          return (graded.getTime() - submitted.getTime()) / (1000 * 60 * 60); // hours
        });
      
      if (responseTimes.length > 0) {
        const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        avgResponseTime = Math.round(avg);
      }
    }
    
    return NextResponse.json({
      stats: {
        classesCount,
        studentsCount,
        pendingGradingCount,
        upcomingBookingsCount: upcomingBookings.length,
        totalGraded: recentlyGraded,
        avgResponseTimeHours: avgResponseTime,
      },
      upcomingBookings: upcomingBookings.map(b => ({
        id: b.id,
        startAt: b.startAt,
        sections: b.sections,
        status: b.status,
        student: b.student,
        exam: b.exam,
        hasAttempt: !!b.attempt,
        attemptId: b.attempt?.id,
      })),
      pendingGrading: pendingGradingSections.map(s => ({
        sectionId: s.id,
        type: s.type,
        attemptId: s.attemptId,
        student: s.attempt.booking.student,
        exam: s.attempt.booking.exam,
        submittedAt: s.attempt.submittedAt,
      }))
    });
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Teachers only" }, { status: 403 });
      }
    }
    
    console.error("Teacher overview error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching overview" },
      { status: 500 }
    );
  }
}

