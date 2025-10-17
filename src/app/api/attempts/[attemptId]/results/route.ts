import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { loadJsonExam } from "@/lib/json-exam-loader";

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
            exam: true,
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

    // Check if this is a JSON exam (stub with no sections in DB)
    let examWithSections = await prisma.exam.findUnique({
      where: { id: attempt.booking.examId },
      include: {
        sections: {
          include: {
            questions: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    // If no sections in DB, load from JSON
    if (!examWithSections?.sections || examWithSections.sections.length === 0) {
      console.log('Loading JSON exam for results:', attempt.booking.examId);
      const jsonExam = await loadJsonExam(attempt.booking.examId);
      if (jsonExam) {
        examWithSections = {
          ...examWithSections!,
          sections: jsonExam.sections as any,
        };
      }
    }

    if (!examWithSections?.sections || examWithSections.sections.length === 0) {
      return NextResponse.json(
        { error: "Exam sections not found" },
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
      // For JSON exams, we may not have attempt.sections in DB, so compute from answers
      const studentAnswers = (attempt.answers as any) || {};
      
      const perSection = examWithSections.sections.map((examSection: any) => {
        const attemptSec = attempt.sections.find((as) => as.type === examSection.type);
        const totalQuestions = examSection.questions?.length || 0;
        
        let correctCount = 0;
        if (attemptSec && attemptSec.rawScore !== null) {
          // Use DB score if available
          correctCount = attemptSec.rawScore;
        } else {
          // Compute score from answers (for JSON exams)
          correctCount = examSection.questions.filter((q: any) => {
            const studentAnswer = studentAnswers[q.id];
            const answerKey = q.answerKey as any;
            
            if (q.qtype === "TF") {
              return studentAnswer === answerKey?.value;
            } else if (q.qtype === "MCQ_SINGLE" || q.qtype === "SELECT") {
              return studentAnswer === answerKey?.index;
            } else if (q.qtype === "MCQ_MULTI") {
              const sorted = Array.isArray(studentAnswer) ? [...studentAnswer].sort() : [];
              const correctSorted = Array.isArray(answerKey?.indices) ? [...answerKey.indices].sort() : [];
              return JSON.stringify(sorted) === JSON.stringify(correctSorted);
            } else if (q.qtype === "GAP") {
              const normalized = typeof studentAnswer === "string" ? studentAnswer.trim().toLowerCase() : "";
              const accepted = answerKey?.answers || [];
              return accepted.some((a: string) => a.trim().toLowerCase() === normalized);
            } else if (q.qtype === "ORDER_SENTENCE") {
              return JSON.stringify(studentAnswer) === JSON.stringify(answerKey?.order);
            } else if (q.qtype === "DND_GAP") {
              const blanks = answerKey?.blanks || [];
              if (Array.isArray(studentAnswer) && studentAnswer.length === blanks.length) {
                return studentAnswer.every((v: string, i: number) =>
                  v.trim().toLowerCase() === blanks[i].trim().toLowerCase()
                );
              }
              return false;
            }
            return false;
          }).length;
        }

        return {
          type: examSection.type,
          title: examSection.title || examSection.type,
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
      // For JSON exams, answers are stored in attempt.answers, not in attempt_sections
      const allStudentAnswers = (attempt.answers as any) || {};
      
      const fullSections = await Promise.all(
        examWithSections.sections.map(async (examSection: any) => {
          const attemptSection = attempt.sections.find(
            (as) => as.type === examSection.type
          );

          // Use attemptSection.answers if available (DB exam), otherwise use attempt.answers (JSON exam)
          const studentAnswers = (attemptSection?.answers as Record<string, any>) || allStudentAnswers;

          const questions = examSection.questions.map((q: any) => {
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
