import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { z } from "zod";

const assignmentSchema = z.object({
  unitExamId: z.string().min(1),
  studentId: z.string().min(1),
  classId: z.string().optional(),
  startAt: z.string().datetime().optional(),
  dueAt: z.string().datetime().optional(),
});

// POST /api/assignments { unitExamId, studentId, classId?, startAt?, dueAt? }
export async function POST(request: Request) {
  try {
    const teacher = await requireTeacher();
    if ((teacher as any).role === "TEACHER" && !(teacher as any).approved) {
      return NextResponse.json({ error: "Approval required" }, { status: 403 });
    }

    const body = await request.json();
    const { unitExamId, studentId, classId, startAt, dueAt } = assignmentSchema.parse(body);

    const teacherId = (teacher as any).id as string;
    const branchId = (teacher as any).branchId ?? null;

    // Verify unitExam exists and exam is active
    const unitExam = await prisma.unitExam.findUnique({
      where: { id: unitExamId },
      include: { exam: true, unit: { include: { book: { include: { track: true } } } } },
    });
    if (!unitExam) return NextResponse.json({ error: "UnitExam not found" }, { status: 404 });
    if (!unitExam.exam?.isActive) return NextResponse.json({ error: "Exam is not active" }, { status: 400 });

    // Verify student exists and role
    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== "STUDENT") {
      return NextResponse.json({ error: "Invalid student" }, { status: 400 });
    }

    // Branch consistency: teacher and student must share branch (unless elevated role handled by requireTeacher already)
    if (branchId && student.branchId && branchId !== student.branchId) {
      return NextResponse.json({ error: "Cross-branch assignment is not allowed" }, { status: 403 });
    }

    // If classId provided, verify the class belongs to the teacher and student is enrolled
    if (classId) {
      const klass = await prisma.class.findFirst({
        where: {
          id: classId,
          teacherId: teacherId,
          ...(branchId ? { branchId } : {}),
        },
      });
      if (!klass) return NextResponse.json({ error: "Class not found" }, { status: 404 });

      const enrolled = await prisma.classStudent.findFirst({
        where: { classId, studentId },
      });
      if (!enrolled) {
        return NextResponse.json({ error: "Student is not in this class" }, { status: 400 });
      }
    } else {
      // If no classId, still require the student to be in any class of this teacher
      const inTeacherClass = await prisma.classStudent.findFirst({
        where: { studentId, class: { teacherId } },
      });
      if (!inTeacherClass) {
        return NextResponse.json({ error: "Student is not in your classes" }, { status: 403 });
      }
    }

    const parsedStart = startAt ? new Date(startAt) : null;
    const parsedDue = dueAt ? new Date(dueAt) : null;
    if (parsedStart && parsedDue && parsedStart > parsedDue) {
      return NextResponse.json({ error: "startAt must be <= dueAt" }, { status: 400 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        unitExamId,
        studentId,
        teacherId,
        classId: classId ?? null,
        branchId,
        startAt: parsedStart,
        dueAt: parsedDue,
        status: "ASSIGNED",
      },
      include: {
        unitExam: { include: { exam: { select: { id: true, title: true } }, unit: { select: { id: true, title: true } } } },
        student: { select: { id: true, name: true, email: true } },
      },
    });

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: studentId,
        channel: "in_app",
        title: `New Assignment: ${assignment.unitExam.exam.title}`,
        body: `You have been assigned a unit exam.`,
        meta: { assignmentId: assignment.id, unitExamId },
        sentAt: new Date(),
      },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && (error.message.includes("Unauthorized") || error.message.includes("Forbidden"))) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}


