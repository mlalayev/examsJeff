import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";

// GET /api/classes/[id]/roster - Get roster with latest attempt for each student
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireTeacher();
    const { id: classId } = await params;
    
    // Verify the class belongs to this teacher
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: (user as any).id,
        branchId: (user as any).branchId ?? undefined,
      },
      include: {
        classStudents: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });
    
    if (!classData) {
      return NextResponse.json(
        { error: "Class not found or you don't have permission to view it" },
        { status: 404 }
      );
    }
    
    // Get latest attempt for each student
    const roster = await Promise.all(
      classData.classStudents.map(async (enrollment) => {
        const latestAttempt = await prisma.attempt.findFirst({
          where: {
            studentId: enrollment.studentId,
          },
          orderBy: {
            createdAt: "desc"
          },
          select: {
            id: true,
            bandOverall: true,
            status: true,
            createdAt: true,
          }
        });
        
        return {
          enrollmentId: enrollment.id,
          student: enrollment.student,
          enrolledAt: enrollment.createdAt,
          latestAttempt: latestAttempt || null,
        };
      })
    );
    
    return NextResponse.json({
      class: {
        id: classData.id,
        name: classData.name,
        createdAt: classData.createdAt,
      },
      roster
    });
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.startsWith("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    console.error("Get roster error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the roster" },
      { status: 500 }
    );
  }
}

