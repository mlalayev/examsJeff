import { teacherStudentScope } from '@/lib/teacher-exam-scope';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireTeacher();
    const { id: studentId } = await params;

    const scope = await teacherStudentScope(user.id, studentId, new URL(request.url).searchParams.get('classId'));
    if (!scope.classes.length) return NextResponse.json({error:'Forbidden'}, {status:403});
    const allowedExams = await prisma.exam.findMany({where:{category:{in:scope.categories}},select:{id:true}});
    // Return every attempt, but only for this student's subjects taught by this teacher.
    const attempts = await prisma.attempt.findMany({
      where: {
        examId: {in:allowedExams.map(e=>e.id)},
        OR: [
          { studentId },
          { booking: { studentId } },
          { assignment: { studentId } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        submittedAt: true,
        examId: true,
        placementLevel: true,
        sections: {
          select: {
            type: true,
            rawScore: true,
            maxScore: true,
          },
        },
        booking: {
          select: {
            exam: {
              select: {
                id: true,
                title: true,
                category: true,
              },
            },
          },
        },
      },
    });

    const examIds = [...new Set(attempts.map((a) => a.examId))];
    const exams = examIds.length
      ? await prisma.exam.findMany({
          where: { id: { in: examIds } },
          select: { id: true, title: true, category: true },
        })
      : [];
    const examMap = new Map(exams.map((e) => [e.id, e]));

    // Calculate overall percentage for each attempt
    const data = attempts.map((a) => {
      const autoSections = a.sections.filter((s) => s.type !== "WRITING");
      const totalRaw = autoSections.reduce((acc, s) => acc + (s.rawScore || 0), 0);
      const totalMax = autoSections.reduce((acc, s) => acc + (s.maxScore || 0), 0);
      const percent = totalMax > 0 ? Math.round((totalRaw / totalMax) * 100) : null;

      return {
        id: a.id,
        status: a.status,
        createdAt: a.createdAt,
        submittedAt: a.submittedAt,
        overallPercent: percent,
        placementLevel: a.placementLevel ?? null,
        exam: examMap.get(a.examId) ?? a.booking?.exam ?? null,
        sections: a.sections.map((s) => ({
          type: s.type,
          rawScore: s.rawScore,
          maxScore: s.maxScore,
        })),
      };
    });

    return NextResponse.json({ attempts: data });
  } catch (error) {
    console.error("Get student attempts error:", error);
    return NextResponse.json({ error: "Failed to fetch attempts" }, { status: 500 });
  }
}

