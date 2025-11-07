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
      // Structure: { sectionType: { questionId: answer } }
      const allStudentAnswers = (attempt.answers as any) || {};
      
      const perSection = examWithSections.sections.map((examSection: any) => {
        const attemptSec = attempt.sections.find((as) => as.type === examSection.type);
        const totalQuestions = examSection.questions?.length || 0;
        
        // Get answers for this specific section
        const studentAnswers = (attemptSec?.answers as Record<string, any>) || allStudentAnswers[examSection.type] || {};
        
        let correctCount = 0;
        if (attemptSec && attemptSec.rawScore !== null) {
          // Use DB score if available
          correctCount = attemptSec.rawScore;
        } else {
          // Compute score from answers (for JSON exams)
          correctCount = examSection.questions.filter((q: any) => {
            const studentAnswer = studentAnswers[q.id];
            const answerKey = q.answerKey as any;
            
            // Legacy support: TF, SELECT, MCQ_MULTI, ORDER_SENTENCE converted to MCQ_SINGLE or INLINE_SELECT
            if (q.qtype === "TF") {
              // Convert TF to MCQ_SINGLE logic
              const correctBool = answerKey?.value;
              return studentAnswer === (correctBool === true ? 0 : 1);
            } else if (q.qtype === "MCQ_SINGLE" || q.qtype === "SELECT" || q.qtype === "INLINE_SELECT") {
              return studentAnswer === answerKey?.index;
            } else if (q.qtype === "MCQ_MULTI") {
              // Legacy: treat as MCQ_SINGLE (just check first answer)
              const sorted = Array.isArray(studentAnswer) ? [...studentAnswer].sort() : [];
              const correctSorted = Array.isArray(answerKey?.indices) ? [...answerKey.indices].sort() : [];
              return JSON.stringify(sorted) === JSON.stringify(correctSorted);
            } else if (q.qtype === "GAP") {
              const normalized = typeof studentAnswer === "string" ? studentAnswer.trim().toLowerCase() : "";
              const accepted = answerKey?.answers || [];
              return accepted.some((a: string) => a.trim().toLowerCase() === normalized);
            } else if (q.qtype === "ORDER_SENTENCE") {
              // Legacy: treat as not supported, return false
              return false;
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
      // Structure: { sectionType: { questionId: answer } }
      const allStudentAnswers = (attempt.answers as any) || {};
      
      const fullSections = await Promise.all(
        examWithSections.sections.map(async (examSection: any) => {
          const attemptSection = attempt.sections.find(
            (as) => as.type === examSection.type
          );

          // Use attemptSection.answers if available (DB exam), otherwise use section-specific answers (JSON exam)
          const studentAnswers = (attemptSection?.answers as Record<string, any>) || allStudentAnswers[examSection.type] || {};

          const questions = examSection.questions.map((q: any) => {
            const studentAnswer = studentAnswers[q.id];
            const answerKey = q.answerKey as any;

            // Simple correctness check (could use scoring utility)
            let isCorrect = false;
            // Legacy support: TF, SELECT, MCQ_MULTI, ORDER_SENTENCE converted to MCQ_SINGLE or INLINE_SELECT
            if (q.qtype === "TF") {
              // Convert TF to MCQ_SINGLE logic
              const correctBool = answerKey?.value;
              isCorrect = studentAnswer === (correctBool === true ? 0 : 1);
            } else if (q.qtype === "MCQ_SINGLE" || q.qtype === "SELECT" || q.qtype === "INLINE_SELECT") {
              isCorrect = studentAnswer === answerKey?.index;
            } else if (q.qtype === "MCQ_MULTI") {
              // Legacy: treat as MCQ_SINGLE (just check first answer)
              const sorted = Array.isArray(studentAnswer) ? [...studentAnswer].sort() : [];
              const correctSorted = Array.isArray(answerKey?.indices) ? [...answerKey.indices].sort() : [];
              isCorrect = JSON.stringify(sorted) === JSON.stringify(correctSorted);
            } else if (q.qtype === "GAP") {
              const normalized = typeof studentAnswer === "string" ? studentAnswer.trim().toLowerCase() : "";
              const accepted = answerKey?.answers || [];
              isCorrect = accepted.some((a: string) => a.trim().toLowerCase() === normalized);
            } else if (q.qtype === "ORDER_SENTENCE") {
              // Legacy: treat as not supported, return false
              isCorrect = false;
            } else if (q.qtype === "DND_GAP") {
              const blanks = answerKey?.blanks || [];
              if (Array.isArray(studentAnswer) && studentAnswer.length === blanks.length) {
                isCorrect = studentAnswer.every((v: string, i: number) =>
                  v.trim().toLowerCase() === blanks[i].trim().toLowerCase()
                );
              }
            }

            // Format answers for display
            let displayStudentAnswer = studentAnswer;
            let displayCorrectAnswer: any = answerKey;
            
            // For INLINE_SELECT, MCQ_SINGLE, SELECT: show text instead of index
            if (q.qtype === "INLINE_SELECT" || q.qtype === "MCQ_SINGLE" || q.qtype === "SELECT") {
              const choices = q.options?.choices || [];
              if (typeof studentAnswer === "number" && choices[studentAnswer]) {
                displayStudentAnswer = choices[studentAnswer];
              }
              if (typeof answerKey?.index === "number" && choices[answerKey.index]) {
                displayCorrectAnswer = choices[answerKey.index];
              }
            }
            // For MCQ_MULTI: show array of text instead of indices
            else if (q.qtype === "MCQ_MULTI") {
              const choices = q.options?.choices || [];
              if (Array.isArray(studentAnswer)) {
                displayStudentAnswer = studentAnswer.map((idx: number) => choices[idx] || idx);
              }
              if (Array.isArray(answerKey?.indices)) {
                displayCorrectAnswer = answerKey.indices.map((idx: number) => choices[idx] || idx);
              }
            }
            // For DND_GAP: show the blanks
            else if (q.qtype === "DND_GAP") {
              displayCorrectAnswer = answerKey?.blanks || [];
            }
            // For GAP: show accepted answers
            else if (q.qtype === "GAP") {
              displayCorrectAnswer = answerKey?.answers?.[0] || answerKey?.answers || [];
            }
            // For TF: show boolean as text
            else if (q.qtype === "TF") {
              displayStudentAnswer = studentAnswer === true ? "True" : studentAnswer === false ? "False" : studentAnswer;
              displayCorrectAnswer = answerKey?.value === true ? "True" : answerKey?.value === false ? "False" : answerKey?.value;
            }
            
            return {
              id: q.id,
              qtype: q.qtype,
              prompt: q.prompt,
              options: q.options,
              order: q.order,
              maxScore: q.maxScore,
              studentAnswer: displayStudentAnswer,
              correctAnswer: displayCorrectAnswer,
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
