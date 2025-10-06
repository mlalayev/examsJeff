import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";

// GET /api/attempt-sections/[id] - Get section details for grading
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireTeacher();
    const teacherId = (user as any).id;
    
    // Get section with related data
    const section = await prisma.attemptSection.findUnique({
      where: { id: params.id },
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
                },
                teacher: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!section) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }
    
    // Verify teacher owns this booking
    if (section.attempt.booking.teacherId !== teacherId) {
      return NextResponse.json(
        { error: "Unauthorized - not your student" },
        { status: 403 }
      );
    }
    
    // Only allow grading Writing and Speaking
    if (section.type !== "WRITING" && section.type !== "SPEAKING") {
      return NextResponse.json(
        { error: "Only Writing and Speaking sections can be manually graded" },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      section: {
        id: section.id,
        type: section.type,
        answers: section.answers,
        bandScore: section.bandScore,
        rubric: section.rubric,
        feedback: section.feedback,
        gradedById: section.gradedById,
        startedAt: section.startedAt,
        endedAt: section.endedAt,
        status: section.status,
      },
      attempt: {
        id: section.attempt.id,
        status: section.attempt.status,
        submittedAt: section.attempt.submittedAt,
        bandOverall: section.attempt.bandOverall,
      },
      student: section.attempt.booking.student,
      exam: section.attempt.booking.exam,
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
    
    console.error("Get section error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching section" },
      { status: 500 }
    );
  }
}

