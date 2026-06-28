import { prisma } from "@/lib/prisma";
import { assertSameBranchOrBoss } from "@/lib/auth-utils";
import { formatUserName } from "@/lib/homework-utils";

type AssignInput = {
  examId: string;
  studentIds: string[];
  classId?: string;
  startAt?: string;
  dueAt?: string;
  isExtra?: boolean;
};

type AssignContext = {
  userId: string;
  role: string;
  branchId: string | null;
  teacherId?: string | null;
};

export async function assignHomeworkToStudents(
  input: AssignInput,
  ctx: AssignContext
) {
  const exam = await prisma.exam.findUnique({
    where: { id: input.examId },
    select: { id: true, title: true, isActive: true, isHomework: true },
  });

  if (!exam) throw new Error("Homework not found");
  if (!exam.isHomework) throw new Error("Not a homework template");
  if (!exam.isActive) throw new Error("Homework is not active");

  const parsedStart = input.startAt ? new Date(input.startAt) : null;
  const parsedDue = input.dueAt ? new Date(input.dueAt) : null;
  if (parsedStart && parsedDue && parsedStart > parsedDue) {
    throw new Error("startAt must be <= dueAt");
  }

  if (input.classId) {
    const klass = await prisma.class.findUnique({
      where: { id: input.classId },
      select: { id: true, branchId: true, teacherId: true },
    });
    if (!klass) throw new Error("Class not found");
    if (klass.branchId) {
      assertSameBranchOrBoss({ role: ctx.role, branchId: ctx.branchId }, klass.branchId);
    }
    if (ctx.role === "TEACHER" && klass.teacherId !== ctx.userId) {
      throw new Error("Forbidden: Not your class");
    }
  }

  const students = await prisma.user.findMany({
    where: { id: { in: input.studentIds }, role: "STUDENT" },
    select: { id: true, branchId: true, firstName: true, lastName: true, email: true },
  });

  if (students.length !== input.studentIds.length) {
    throw new Error("One or more invalid students");
  }

  if (ctx.role === "TEACHER") {
    const allowed = await prisma.classStudent.findMany({
      where: {
        studentId: { in: input.studentIds },
        class: { teacherId: ctx.userId },
      },
      select: { studentId: true },
    });
    const allowedIds = new Set(allowed.map((a) => a.studentId));
    const invalid = input.studentIds.filter((id) => !allowedIds.has(id));
    if (invalid.length > 0) {
      throw new Error("Forbidden: Student is not in your classes");
    }
  }

  for (const student of students) {
    if (student.branchId) {
      assertSameBranchOrBoss(
        { role: ctx.role, branchId: ctx.branchId },
        student.branchId
      );
    }

    if (input.classId) {
      const enrolled = await prisma.classStudent.findFirst({
        where: { classId: input.classId, studentId: student.id },
      });
      if (!enrolled) {
        throw new Error(`Student ${formatUserName(student) || student.email} is not in this class`);
      }
    }
  }

  const teacherId =
    ctx.role === "TEACHER" ? ctx.userId : (ctx.teacherId ?? null);

  const created = await prisma.$transaction(
    students.map((student) =>
      prisma.assignment.create({
        data: {
          examId: input.examId,
          studentId: student.id,
          teacherId,
          classId: input.classId ?? null,
          branchId: ctx.branchId ?? student.branchId ?? null,
          startAt: parsedStart,
          dueAt: parsedDue,
          status: "ASSIGNED",
          isExtra: input.isExtra ?? false,
        },
        select: { id: true, studentId: true },
      })
    )
  );

  await Promise.all(
    students.map((student) =>
      prisma.notification.create({
        data: {
          userId: student.id,
          channel: "in_app",
          title: `New Homework: ${exam.title}`,
          body: "You have been assigned new homework.",
          meta: { examId: exam.id, homework: true },
          sentAt: new Date(),
        },
      })
    )
  );

  return { assignments: created, count: created.length };
}
