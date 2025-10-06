import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";

// GET /api/grading/queue - Get attempts with Writing/Speaking sections pending grading
export async function GET(request: Request) {
  try {
    const user = await requireTeacher();
    const teacherId = (user as any).id;
    
    // Get URL params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending"; // pending | all
    
    // Find attempts where:
    // 1. Attempt is SUBMITTED
    // 2. Has W/S sections
    // 3. Teacher taught the student (via class enrollment)
    // 4. Section not yet graded (bandScore is null)
    
    const attempts = await prisma.attempt.findMany({
      where: {
        status: "SUBMITTED",
        booking: {
          teacherId: teacherId, // Only show attempts from this teacher's bookings
        },
        sections: {
          some: {
            type: {
              in: ["WRITING", "SPEAKING"]
            },
            ...(status === "pending" ? {
              bandScore: null // Only ungraded sections
            } : {})
          }
        }
      },
      include: {
        sections: {
          where: {
            type: {
              in: ["WRITING", "SPEAKING"]
            }
          },
          orderBy: {
            type: "asc"
          }
        },
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
      },
      orderBy: {
        submittedAt: "asc" // Oldest first
      }
    });
    
    // Format response with section details
    const queue = attempts.map(attempt => {
      const pendingSections = attempt.sections.filter(s => s.bandScore === null);
      const gradedSections = attempt.sections.filter(s => s.bandScore !== null);
      
      return {
        attemptId: attempt.id,
        student: attempt.booking.student,
        exam: attempt.booking.exam,
        submittedAt: attempt.submittedAt,
        bandOverall: attempt.bandOverall,
        sections: attempt.sections.map(s => ({
          id: s.id,
          type: s.type,
          bandScore: s.bandScore,
          gradedById: s.gradedById,
          status: s.bandScore !== null ? "graded" : "pending"
        })),
        pendingCount: pendingSections.length,
        gradedCount: gradedSections.length,
        totalSections: attempt.sections.length,
      };
    });
    
    return NextResponse.json({
      queue,
      total: queue.length,
      pendingTotal: queue.filter(q => q.pendingCount > 0).length,
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
    
    console.error("Grading queue error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching grading queue" },
      { status: 500 }
    );
  }
}

