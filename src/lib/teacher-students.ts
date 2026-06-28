import { prisma } from "@/lib/prisma";
import { formatUserName } from "@/lib/homework-utils";

export type TeacherStudentRow = {
  id: string;
  name: string;
  email: string;
  classId: string | null;
  className: string | null;
};

/** All students a teacher may assign homework to (classes + profile link). */
export async function getTeacherStudents(teacherId: string): Promise<TeacherStudentRow[]> {
  const [classRows, profileRows] = await Promise.all([
    prisma.classStudent.findMany({
      where: { class: { teacherId } },
      select: {
        studentId: true,
        classId: true,
        class: { select: { id: true, name: true } },
        student: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.studentProfile.findMany({
      where: { teacherId },
      select: {
        student: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
  ]);

  const map = new Map<string, TeacherStudentRow>();

  for (const row of classRows) {
    map.set(row.student.id, {
      id: row.student.id,
      name: formatUserName(row.student) || row.student.email,
      email: row.student.email,
      classId: row.class.id,
      className: row.class.name,
    });
  }

  for (const row of profileRows) {
    if (!map.has(row.student.id)) {
      map.set(row.student.id, {
        id: row.student.id,
        name: formatUserName(row.student) || row.student.email,
        email: row.student.email,
        classId: null,
        className: null,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function teacherOwnsStudents(
  teacherId: string,
  studentIds: string[]
): Promise<boolean> {
  if (studentIds.length === 0) return false;
  const allowed = await getTeacherStudents(teacherId);
  const allowedIds = new Set(allowed.map((s) => s.id));
  return studentIds.every((id) => allowedIds.has(id));
}
