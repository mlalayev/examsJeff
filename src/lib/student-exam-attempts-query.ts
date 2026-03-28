import { prisma } from "@/lib/prisma";

export type StudentExamAttemptRow = {
  attemptId: string;
  examId: string;
  examTitle: string;
  category: string | null;
  track: string | null;
  status: string;
  createdAt: Date;
  submittedAt: Date | null;
  bookingId: string | null;
  assignedAt: Date | null;
};

/**
 * All attempts for a student (by Attempt.studentId). Admin/creator dashboards only.
 */
export async function fetchStudentExamAttemptsForDashboard(
  studentId: string
): Promise<{ exams: StudentExamAttemptRow[] } | null> {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, role: true },
  });

  if (!student || student.role !== "STUDENT") {
    return null;
  }

  // Single predicate avoids Prisma OR + optional relation edge cases across DBs.
  const attempts = await prisma.attempt.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true,
      status: true,
      createdAt: true,
      submittedAt: true,
      examId: true,
      exam: {
        select: { id: true, title: true, category: true, track: true },
      },
      booking: {
        select: { id: true, startAt: true },
      },
    },
  });

  const seen = new Set<string>();
  const rows = attempts.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  return {
    exams: rows.map((a) => ({
      attemptId: a.id,
      examId: a.examId,
      examTitle: a.exam?.title ?? "Unknown exam",
      category: a.exam?.category != null ? String(a.exam.category) : null,
      track: a.exam?.track ?? null,
      status: a.status,
      createdAt: a.createdAt,
      submittedAt: a.submittedAt,
      bookingId: a.booking?.id ?? null,
      assignedAt: a.booking?.startAt ?? null,
    })),
  };
}
