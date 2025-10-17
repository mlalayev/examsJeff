import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

/**
 * GET /api/attempts/:attemptId/results
 * Returns exam results based on user role:
 * - STUDENT (owner): Summary only (total score, per-section correct/total counts)
 * - TEACHER/ADMIN/BOSS: Full review (all questions with correct answers and explanations)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await requireAuth();
    const { attemptId } = await params;

    // Fetch attempt with all details
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        booking: {
          include: {
            exam: {
              include: {
                sections: {
                  include: {
                    questions: true,
                  },
                  orderBy: { order: "asc" },
                },
              },
            },
            student: true,
            teacher: true,
          },
        },
        sections: true,
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found" },
        { status: 404 }
      );
    }

    const role = (user as any).role;
    const isOwner = attempt.booking.studentId === user.id;
    const isTeacher = role === "TEACHER" || role === "ADMIN" || role === "BRANCH_ADMIN" || role === "BOSS";

    // Authorization check
    if (!isOwner && !isTeacher) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Check if submitted
    if (attempt.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "Attempt not submitted yet" },
        { status: 400 }
      );
    }

    // STUDENT VIEW: Summary only
    if (role === "STUDENT" && isOwner) {
      const perSection = attempt.sections.map((attemptSec) => {
        const examSection = attempt.booking.exam.sections.find(
          (s) => s.type === attemptSec.type
        );

        const totalQuestions = examSection?.questions.length || 0;
        const correctCount = attemptSec.rawScore || 0;

        return {
          type: attemptSec.type,
          title: examSection?.title || attemptSec.type,
          correct: correctCount,
          total: totalQuestions,
          percentage: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
        };
      });

      // Calculate overall
      const totalCorrect = perSection.reduce((sum, s) => sum + s.correct, 0);
      const totalQuestions = perSection.reduce((sum, s) => sum + s.total, 0);
      const totalPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

      return NextResponse.json({
        attemptId: attempt.id,
        examTitle: attempt.booking.exam.title,
        studentName: attempt.booking.student.name || attempt.booking.student.email,
        submittedAt: attempt.submittedAt,
        status: attempt.status,
        role: "STUDENT",
        summary: {
          totalCorrect,
          totalQuestions,
          totalPercentage,
          perSection,
        },
      });
    }

    // TEACHER VIEW: Full review
    if (isTeacher) {
      const fullSections = await Promise.all(
        attempt.booking.exam.sections.map(async (examSection) => {
          const attemptSection = attempt.sections.find(
            (as) => as.type === examSection.type
          );

          const studentAnswers = attemptSection?.answers as Record<string, any> || {};

          const questions = examSection.questions.map((q) => {
            const studentAnswer = studentAnswers[q.id];
            const answerKey = q.answerKey as any;

            // Simple correctness check (could use scoring utility)
            let isCorrect = false;
            if (q.qtype === "TF") {
              isCorrect = studentAnswer === answerKey?.value;
            } else if (q.qtype === "MCQ_SINGLE" || q.qtype === "SELECT") {
              isCorrect = studentAnswer === answerKey?.index;
            } else if (q.qtype === "MCQ_MULTI") {
              const sorted = Array.isArray(studentAnswer) ? [...studentAnswer].sort() : [];
              const correctSorted = Array.isArray(answerKey?.indices) ? [...answerKey.indices].sort() : [];
              isCorrect = JSON.stringify(sorted) === JSON.stringify(correctSorted);
            } else if (q.qtype === "GAP") {
              const normalized = typeof studentAnswer === "string" ? studentAnswer.trim().toLowerCase() : "";
              const accepted = answerKey?.answers || [];
              isCorrect = accepted.some((a: string) => a.trim().toLowerCase() === normalized);
            } else if (q.qtype === "ORDER_SENTENCE") {
              isCorrect = JSON.stringify(studentAnswer) === JSON.stringify(answerKey?.order);
            } else if (q.qtype === "DND_GAP") {
              const blanks = answerKey?.blanks || [];
              if (Array.isArray(studentAnswer) && studentAnswer.length === blanks.length) {
                isCorrect = studentAnswer.every((v: string, i: number) =>
                  v.trim().toLowerCase() === blanks[i].trim().toLowerCase()
                );
              }
            }

            return {
              id: q.id,
              qtype: q.qtype,
              prompt: q.prompt,
              options: q.options,
              order: q.order,
              maxScore: q.maxScore,
              studentAnswer,
              correctAnswer: answerKey,
              isCorrect,
              explanation: q.explanation,
            };
          });

          const correctCount = questions.filter((q) => q.isCorrect).length;

          return {
            type: examSection.type,
            title: examSection.title,
            correct: correctCount,
            total: questions.length,
            percentage: questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0,
            questions,
          };
        })
      );

      const totalCorrect = fullSections.reduce((sum, s) => sum + s.correct, 0);
      const totalQuestions = fullSections.reduce((sum, s) => sum + s.total, 0);
      const totalPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

      return NextResponse.json({
        attemptId: attempt.id,
        examTitle: attempt.booking.exam.title,
        studentName: attempt.booking.student.name || attempt.booking.student.email,
        submittedAt: attempt.submittedAt,
        status: attempt.status,
        role: "TEACHER",
        summary: {
          totalCorrect,
          totalQuestions,
          totalPercentage,
        },
        sections: fullSections,
      });
    }

    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  } catch (error: any) {
    console.error("Error fetching attempt results:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch results" },
      { status: 500 }
    );
  }
}
