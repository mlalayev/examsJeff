import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";

// GET /api/teacher/overview - Teacher dashboard overview data
export async function GET() {
  try {
    const user = await requireTeacher();
    const teacherId = (user as any).id;
    const branchId = (user as any).branchId ?? null;
    const role = (user as any).role as string;
    
    const now = new Date();
    
    // OPTIMIZED: Run all queries in parallel with Promise.all
    const [
      classesCount,
      studentsCount,
      upcomingBookings,
      pendingGradingCount,
      pendingGradingSections,
      recentlyGraded
    ] = await Promise.all([
      // Count classes
      prisma.class.count({
        where: {
          teacherId,
          ...(role === "BRANCH_ADMIN" ? { branchId: branchId ?? undefined } : {}),
        }
      }),
      
      // Count unique students across all classes
      prisma.classStudent.count({
        where: {
          class: {
            teacherId,
            ...(role === "BRANCH_ADMIN" ? { branchId: branchId ?? undefined } : {}),
          }
        }
      }),
      
      // Get upcoming bookings
      prisma.booking.findMany({
      where: {
        teacherId,
        ...(role === "BRANCH_ADMIN" ? { branchId: branchId ?? undefined } : {}),
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
      }),
      
      // Count pending grading (W/S sections not yet graded)
      prisma.attemptSection.count({
      where: {
        type: {
          in: ["WRITING", "SPEAKING"]
        },
        bandScore: null,
        attempt: {
          status: "SUBMITTED",
          booking: {
            teacherId,
            ...(role === "BRANCH_ADMIN" ? { branchId: branchId ?? undefined } : {}),
          }
        }
      }}),
      
      // Get pending grading sections (for quick list)
      prisma.attemptSection.findMany({
      where: {
        type: {
          in: ["WRITING", "SPEAKING"]
        },
        bandScore: null,
        attempt: {
          status: "SUBMITTED",
          booking: {
            teacherId,
            ...(role === "BRANCH_ADMIN" ? { branchId: branchId ?? undefined } : {}),
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
      }),
      
      // Get recent graded sections (activity)
      prisma.attemptSection.count({
      where: {
        type: {
          in: ["WRITING", "SPEAKING"]
        },
        gradedById: teacherId,
        attempt: {
          booking: {
            teacherId,
            ...(role === "BRANCH_ADMIN" ? { branchId: branchId ?? undefined } : {}),
          }
        }
      }})
    ]);
    
    // REMOVED: avgResponseTime calculation (too expensive, not critical)
    // This was causing additional slow query
    
    /* REMOVED EXPENSIVE QUERY:
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
            teacherId,
            ...(role === "BRANCH_ADMIN" ? { branchId: branchId ?? undefined } : {}),
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
    */
    
    return NextResponse.json({
      stats: {
        classesCount,
        studentsCount,
        pendingGradingCount,
        upcomingBookingsCount: upcomingBookings.length,
        totalGraded: recentlyGraded,
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

