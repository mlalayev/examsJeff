import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await requireStudent();
    const studentId = (user as any).id as string;

    // Find attempts by studentId directly, or through booking/assignment
    const attempts = await prisma.attempt.findMany({
      where: {
        OR: [
          { studentId },
          { booking: { studentId } },
          { assignment: { studentId } }
        ]
      },
      orderBy: { createdAt: "desc" },
      include: {
        sections: true,
        booking: { 
          select: { 
            id: true, 
            exam: { select: { id: true, title: true, category: true, track: true } },
            teacher: { select: { id: true, name: true } }
          } 
        },
        assignment: {
          select: {
            id: true,
            class: {
              select: {
                id: true,
                name: true,
                teacher: { select: { id: true, name: true } }
              }
            }
          }
        },
      },
    });

    // Get student's classes for all attempts
    const studentClasses = await prisma.classStudent.findMany({
      where: { studentId },
      include: {
        class: {
          include: {
            teacher: { select: { id: true, name: true } }
          }
        }
      }
    });

    const classMap = new Map(studentClasses.map(cs => [cs.classId, cs.class]));

    const data = attempts.map((a) => {
      const autoSections = a.sections.filter((s) => s.type !== "WRITING");
      const totalRaw = autoSections.reduce((acc, s) => acc + (s.rawScore || 0), 0);
      const totalMax = autoSections.reduce((acc, s) => acc + (s.maxScore || 0), 0);
      const percent = totalMax > 0 ? Math.round((totalRaw / totalMax) * 100) : null;
      
      // Get class from assignment or find by teacher
      let classInfo = null;
      if (a.assignment?.class) {
        classInfo = a.assignment.class;
      } else if (a.booking?.teacher) {
        // Try to find class by teacher
        const teacherClass = Array.from(classMap.values()).find(
          c => c.teacherId === a.booking?.teacher?.id
        );
        if (teacherClass) {
          classInfo = {
            id: teacherClass.id,
            name: teacherClass.name,
            teacher: teacherClass.teacher
          };
        }
      }

      return {
        id: a.id,
        status: a.status,
        createdAt: a.createdAt,
        submittedAt: a.submittedAt,
        overallPercent: percent,
        exam: a.booking?.exam || null,
        class: classInfo,
        sections: a.sections.map((s) => ({ type: s.type, rawScore: s.rawScore, maxScore: s.maxScore })),
      };
    });

    return NextResponse.json({ attempts: data });
  } catch (error: any) {
    console.error("Student attempts history error:", error);
    
    // Return more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized") || error.message.includes("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      return NextResponse.json({ error: error.message || "Failed to load attempts" }, { status: 500 });
    }
    
    return NextResponse.json({ error: "Failed to load attempts" }, { status: 500 });
  }
}
