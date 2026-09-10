import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { classAccessWhere } from "@/lib/class-access";

// GET /api/classes/[id]/roster
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireTeacher();
    const { id: classId } = await params;

    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        ...classAccessWhere({
          id: (user as any).id,
          role: (user as any).role,
          branchId: (user as any).branchId,
        }),
      },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        classStudents: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json(
        { error: "Class not found or you don't have permission to view it" },
        { status: 404 }
      );
    }

    const roster = await Promise.all(
      classData.classStudents.map(async (enrollment) => {
        const latestAttempt = await prisma.attempt.findFirst({
          where: {
            studentId: enrollment.studentId,
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            bandOverall: true,
            status: true,
            createdAt: true,
          },
        });

        const s = enrollment.student;
        return {
          enrollmentId: enrollment.id,
          student: {
            id: s.id,
            email: s.email,
            name:
              [s.firstName, s.lastName].filter(Boolean).join(" ").trim() ||
              null,
          },
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
        teacher: classData.teacher,
      },
      roster,
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
