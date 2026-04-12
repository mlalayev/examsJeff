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
  try {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true },
    });

    if (!student || student.role !== "STUDENT") {
      console.error(`Student not found or not a student role: ${studentId}`);
      return null;
    }

    // Fetch attempts without the exam relation (since it's not defined in schema)
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
        booking: {
          select: { id: true, startAt: true },
        },
      },
    });

    console.log(`Found ${attempts.length} attempts for student ${studentId}`);

    // Get unique exam IDs
    const examIds = [...new Set(attempts.map(a => a.examId))];
    
    // Fetch exam details separately
    const exams = await prisma.exam.findMany({
      where: { id: { in: examIds } },
      select: { id: true, title: true, category: true, track: true },
    });

    // Create a map for quick lookup
    const examMap = new Map(exams.map(e => [e.id, e]));

    const seen = new Set<string>();
    const rows = attempts.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });

    return {
      exams: rows.map((a) => {
        const exam = examMap.get(a.examId);
        
        if (!exam) {
          console.warn(`Attempt ${a.id} references non-existent exam ${a.examId}`);
        }
        
        return {
          attemptId: a.id,
          examId: a.examId,
          examTitle: exam?.title ?? "Deleted exam",
          category: exam?.category != null ? String(exam.category) : null,
          track: exam?.track ?? null,
          status: a.status,
          createdAt: a.createdAt,
          submittedAt: a.submittedAt,
          bookingId: a.booking?.id ?? null,
          assignedAt: a.booking?.startAt ?? null,
        };
      }),
    };
  } catch (error) {
    console.error("Error in fetchStudentExamAttemptsForDashboard:", error);
    throw error; // Re-throw to let the caller handle it
  }
}
