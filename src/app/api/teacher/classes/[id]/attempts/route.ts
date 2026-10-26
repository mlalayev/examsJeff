import { classExamCategories } from '@/lib/teacher-exam-scope';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireTeacher();
    const { id } = await params; // classId

    // Ensure teacher owns the class
    const cls = await prisma.class.findUnique({ where: { id }, select: { id: true, teacherId: true, name:true, classStudents:{select:{studentId:true}} } });
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });
    if (cls.teacherId !== (user as any).id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const exams = await prisma.exam.findMany({where:{category:{in:classExamCategories(cls.name)}},select:{id:true,title:true}});
    const students = await prisma.user.findMany({where:{id:{in:cls.classStudents.map(s=>s.studentId)}},select:{id:true,firstName:true,lastName:true,email:true}});
    const attempts = await prisma.attempt.findMany({
      where: { studentId:{in:cls.classStudents.map(s=>s.studentId)}, examId:{in:exams.map(e=>e.id)} },
      orderBy: { createdAt: "desc" },
      include: {
        sections: true,
        booking: { select: { id: true, student: { select: { id: true, firstName:true,lastName:true, email: true } } } },
      },
    });

    const data = attempts.map((a) => {
      const autoSections = a.sections.filter((s) => s.type !== "WRITING");
      const totalRaw = autoSections.reduce((acc, s) => acc + (s.rawScore || 0), 0);
      const totalMax = autoSections.reduce((acc, s) => acc + (s.maxScore || 0), 0);
      const percent = totalMax > 0 ? Math.round((totalRaw / totalMax) * 100) : null;
      const student = students.find(s=>s.id===a.studentId);
      return {
        id: a.id,
        status: a.status,
        submittedAt: a.submittedAt,
        overallPercent: percent,
        student: student ? {...student,name:[student.firstName,student.lastName].filter(Boolean).join(' ')} : null,
        exam: exams.find(e=>e.id===a.examId),
      };
    });

    return NextResponse.json({ attempts: data });
  } catch (error) {
    console.error("Teacher class attempts error:", error);
    return NextResponse.json({ error: "Failed to load class attempts" }, { status: 500 });
  }
}
