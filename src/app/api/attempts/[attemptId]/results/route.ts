import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  computeIeltsOverallBand,
  getIeltsBandForSection,
  type IeltsReadingType,
} from "@/lib/ielts-band";
import {
  countInlineSelectBlanks,
  getInlineSelectBlankChoices,
} from "@/lib/inline-select-utils";

/**
 * Normalize a single text value for case-/punctuation-insensitive comparison.
 * Mirrors the rules used in @/lib/scoring so the displayed correctness matches
 * the auto-grader.
 */
function normalizeAnswerText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[.,!?\\/\-_:;"'()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Per-field grading for an HTML_CSS question. Returns the number of correct
 * fields and the total number of fields in the answer key. Used so that a
 * single HTML_CSS question with 10 inputs (e.g. an IELTS Listening part)
 * contributes 10 raw points to the section score rather than all-or-nothing.
 */
function gradeHtmlCssFields(
  studentAnswer: any,
  answerKey: any,
): { correct: number; total: number } {
  if (!answerKey || typeof answerKey !== "object" || !answerKey.fields) {
    return { correct: 0, total: 0 };
  }
  const fields = answerKey.fields as Record<
    string,
    { type?: string; accepted?: string[] }
  >;
  const names = Object.keys(fields);
  if (names.length === 0) return { correct: 0, total: 0 };
  const sa = studentAnswer && typeof studentAnswer === "object" ? studentAnswer : {};
  let correct = 0;
  for (const name of names) {
    const spec = fields[name] || ({} as any);
    const studentVal = (sa as Record<string, unknown>)[name];
    if (spec.type === "checkbox") {
      const expected = (spec.accepted?.[0] || "false").toLowerCase() === "true";
      const got =
        studentVal === true ||
        studentVal === "true" ||
        studentVal === 1 ||
        studentVal === "1";
      if (got === expected) correct += 1;
      continue;
    }
    const gotStr = studentVal == null ? "" : String(studentVal);
    if (!gotStr.trim()) continue;
    const gotNorm = normalizeAnswerText(gotStr);
    const accepted = spec.accepted || [];
    const ok = accepted.some((a) => normalizeAnswerText(String(a)) === gotNorm);
    if (ok) correct += 1;
  }
  return { correct, total: names.length };
}

/**
 * Helper function to check if a student answer is correct
 * Optimized and reusable for both student and teacher views
 */
function checkAnswerCorrectness(q: any, studentAnswer: any, answerKey: any): boolean {
  if (q.qtype === "TF") {
    const correctBool = answerKey?.value;
    // Normalize student answer to boolean
    let studentBool: boolean | null = null;
    if (typeof studentAnswer === 'boolean') {
      studentBool = studentAnswer;
    } else if (typeof studentAnswer === 'number') {
      studentBool = studentAnswer === 0; // 0 = true, 1 = false
    } else if (typeof studentAnswer === 'string') {
      const upper = studentAnswer.toUpperCase();
      if (upper === 'TRUE') studentBool = true;
      else if (upper === 'FALSE') studentBool = false;
    }
    return studentBool === correctBool;
  } else if (q.qtype === "TF_NG") {
    // TF_NG: compare as strings (case-insensitive)
    const correctValue = answerKey?.value;
    const studentValue = typeof studentAnswer === 'string' ? studentAnswer.toUpperCase() : String(studentAnswer).toUpperCase();
    const correctValueUpper = typeof correctValue === 'string' ? correctValue.toUpperCase() : String(correctValue).toUpperCase();
    return studentValue === correctValueUpper;
  } else if (q.qtype === "MCQ_SINGLE" || q.qtype === "SELECT" || q.qtype === "INLINE_SELECT") {
    if (
      studentAnswer &&
      typeof studentAnswer === "object" &&
      !Array.isArray(studentAnswer) &&
      Array.isArray(answerKey?.indices)
    ) {
      for (let i = 0; i < answerKey.indices.length; i++) {
        if ((studentAnswer as Record<string, number>)[String(i)] !== answerKey.indices[i]) {
          return false;
        }
      }
      return true;
    }
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
    const correctOrder = Array.isArray(answerKey?.order) ? answerKey.order : [];
    if (!Array.isArray(studentAnswer) || correctOrder.length === 0) return false;
    if (studentAnswer.length !== correctOrder.length) return false;
    return studentAnswer.every(
      (val: any, idx: number) =>
        Number(val) === Number(correctOrder[idx])
    );
  } else if (q.qtype === "DND_GAP") {
    const correctBlanks = answerKey?.blanks || [];
    if (studentAnswer && typeof studentAnswer === "object" && !Array.isArray(studentAnswer)) {
      // Flatten student answers: { "0": ["on", "at"], "1": ["in"] } → ["on", "at", "in"]
      const studentAnswersFlat: string[] = [];
      const sentenceIndices = Object.keys(studentAnswer).sort((a, b) => parseInt(a) - parseInt(b));
      
      for (const sentenceIdx of sentenceIndices) {
        const sentenceAnswers = studentAnswer[sentenceIdx];
        if (Array.isArray(sentenceAnswers)) {
          for (const answer of sentenceAnswers) {
            if (answer !== undefined && answer !== null) {
              studentAnswersFlat.push(answer);
            } else {
              studentAnswersFlat.push("");
            }
          }
        }
      }
      
      if (studentAnswersFlat.length === correctBlanks.length) {
        return studentAnswersFlat.every((v: string, i: number) => {
          if (typeof v !== "string" || typeof correctBlanks[i] !== "string") return false;
          return v.trim().toLowerCase() === correctBlanks[i].trim().toLowerCase();
        });
      }
    }
    return false;
  } else if (q.qtype === "FILL_IN_BLANK") {
    // FILL_IN_BLANK: studentAnswer is { "0": "answer1", "1": "answer2", ... }
    // answerKey.blanks is ["answer1", "answer2", ...]
    const correctBlanks = answerKey?.blanks || [];
    if (!studentAnswer || typeof studentAnswer !== "object") return false;
    
    // Convert student answer object to array
    const studentAnswersArray: string[] = [];
    for (let i = 0; i < correctBlanks.length; i++) {
      const answer = studentAnswer[i.toString()] || "";
      studentAnswersArray.push(answer);
    }
    
    // Compare each blank (case-insensitive, trimmed)
    if (studentAnswersArray.length !== correctBlanks.length) return false;
    return studentAnswersArray.every((studentAns, idx) => {
      const correctAns = correctBlanks[idx] || "";
      return studentAns.trim().toLowerCase() === correctAns.trim().toLowerCase();
    });
  } else if (q.qtype === "HTML_CSS") {
    // HTML_CSS: marked overall-correct only if ALL fields match.
    // Partial credit is computed separately via gradeHtmlCssFields when
    // counting raw scores per section.
    const { correct, total } = gradeHtmlCssFields(studentAnswer, answerKey);
    return total > 0 && correct === total;
  }
  return false;
}

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

    // Fetch attempt with exam details in a single query (optimized)
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        booking: {
          include: {
            exam: {
              include: {
                sections: {
                  include: {
                    questions: {
                      orderBy: { order: "asc" },
                    },
                  },
                  orderBy: { order: "asc" },
                },
              },
            },
            student: true,
            teacher: true,
          },
        },
        sections: {
          include: {
            writingSubmission: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found" },
        { status: 404 }
      );
    }

    if (!attempt.booking) {
      return NextResponse.json(
        { error: "Booking not found for this attempt" },
        { status: 404 }
      );
    }

    const booking = attempt.booking; // Type narrowing for TypeScript

    // Get exam with sections from database
    const examWithSections = booking.exam;

    if (!examWithSections?.sections || examWithSections.sections.length === 0) {
      return NextResponse.json(
        { error: "Exam sections not found" },
        { status: 404 }
      );
    }

    const role = (user as any).role;
    const isOwner = booking.studentId === user.id;
    const isTeacher = role === "TEACHER" || role === "ADMIN" || role === "BRANCH_ADMIN" || role === "BOSS" || role === "BRANCH_BOSS" || role === "CREATOR";
    const isParent =
      role === "PARENT" &&
      (await prisma.parentChild.findFirst({
        where: { parentId: user.id, childId: booking.studentId },
        select: { id: true },
      })) != null;

    // Authorization check
    if (!isOwner && !isTeacher && !isParent) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Check if submitted
    if (attempt.status !== "SUBMITTED") {
      return NextResponse.json(
        {
          error: "Attempt not submitted yet",
          examCategory: examWithSections.category,
        },
        { status: 400 }
      );
    }
    
    // Group sections: parent sections with their subsections
    const parentSections = examWithSections.sections.filter((s: any) => !s.parentSectionId);
    const subsectionsByParent = examWithSections.sections
      .filter((s: any) => s.parentSectionId)
      .reduce((acc: any, sub: any) => {
        if (!acc[sub.parentSectionId]) acc[sub.parentSectionId] = [];
        acc[sub.parentSectionId].push(sub);
        return acc;
      }, {});

    // STUDENT/PARENT VIEW: Summary only
    if ((role === "STUDENT" && isOwner) || isParent) {
      // For JSON exams, we may not have attempt.sections in DB, so compute from answers
      // Structure: { sectionType: { questionId: answer } }
      const allStudentAnswers = (attempt.answers as any) || {};
      const isIelts = examWithSections.category === "IELTS";
      const readingType: IeltsReadingType =
        (examWithSections.readingType || "ACADEMIC").toUpperCase() === "GENERAL_TRAINING"
          ? "GENERAL_TRAINING"
          : "ACADEMIC";

      const perSection = parentSections.map((examSection: any) => {
        const attemptSec = attempt.sections.find((as) => as.type === examSection.type);

        // Collect questions from this section + subsections, tagging which
        // section each question originated from (subsections may reuse ids).
        type QInfo = { q: any; sourceSectionType: string };
        let allQuestions: QInfo[] = [
          ...(examSection.questions || []).map((q: any) => ({
            q,
            sourceSectionType: String(examSection.type),
          })),
        ];
        const sectionSubsections = subsectionsByParent[examSection.id] || [];
        sectionSubsections.forEach((sub: any) => {
          allQuestions = [
            ...allQuestions,
            ...(sub.questions || []).map((q: any) => ({
              q,
              sourceSectionType: String(sub.type),
            })),
          ];
        });

        // Count tasks: HTML_CSS contributes one task per field, every other
        // qtype contributes one task per question.
        let correctCount = 0;
        let totalCount = 0;
        for (const { q, sourceSectionType } of allQuestions) {
          const studentAnswer = attemptSec?.answers
            ? (attemptSec.answers as Record<string, any>)[q.id]
            : (allStudentAnswers[sourceSectionType] || {})[q.id];
          const answerKey = q.answerKey as any;

          if (q.qtype === "HTML_CSS") {
            const { correct, total } = gradeHtmlCssFields(studentAnswer, answerKey);
            // Fallback for malformed answer keys: 1 task = 1 question.
            if (total === 0) {
              totalCount += 1;
              if (checkAnswerCorrectness(q, studentAnswer, answerKey)) correctCount += 1;
            } else {
              totalCount += total;
              correctCount += correct;
            }
            continue;
          }

          totalCount += 1;
          if (checkAnswerCorrectness(q, studentAnswer, answerKey)) correctCount += 1;
        }

        const bandScore = isIelts
          ? getIeltsBandForSection(examSection.type, correctCount, totalCount, { readingType })
          : null;

        return {
          type: examSection.type,
          title: examSection.title || examSection.type,
          correct: correctCount,
          total: totalCount,
          percentage: totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0,
          bandScore,
        };
      });

      // Calculate overall
      const totalCorrect = perSection.reduce((sum, s) => sum + s.correct, 0);
      const totalQuestions = perSection.reduce((sum, s) => sum + s.total, 0);
      const totalPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

      // Get writing submission if exists
      const writingSection = attempt.sections.find((s) => s.type === "WRITING");
      const writingSubmission = writingSection?.writingSubmission || null;
      const speakingSectionStudent = attempt.sections.find((s) => s.type === "SPEAKING");
      const speakingRubricStudent = speakingSectionStudent?.rubric as { ieltsSpeakingAi?: Record<string, unknown> } | null;
      const speakingAiStudent = speakingRubricStudent?.ieltsSpeakingAi ?? null;

      const writingBandForOverall =
        writingSubmission?.overallBand ??
        (writingSubmission?.aiTask1Overall != null &&
        writingSubmission?.aiTask2Overall != null
          ? (writingSubmission.aiTask1Overall + writingSubmission.aiTask2Overall) / 2
          : null);
      const speakingBandForOverall =
        speakingAiStudent && typeof (speakingAiStudent as any).overallBand === "number"
          ? ((speakingAiStudent as any).overallBand as number)
          : null;
      const overallBand = isIelts
        ? computeIeltsOverallBand([
            ...perSection.map((s) => s.bandScore),
            writingBandForOverall ?? null,
            speakingBandForOverall ?? null,
          ])
        : null;

      return NextResponse.json({
        attemptId: attempt.id,
        examTitle: booking.exam.title,
        examCategory: examWithSections.category,
        submittedAt: attempt.submittedAt,
        studentName: booking.student.name || booking.student.email,
        status: attempt.status,
        role: isParent ? "PARENT" : "STUDENT",
        summary: {
          totalCorrect,
          totalQuestions,
          totalPercentage,
          overallBand,
          perSection,
        },
        writingSubmission: writingSubmission ? {
          id: writingSubmission.id,
          task1Response: writingSubmission.task1Response,
          task2Response: writingSubmission.task2Response,
          wordCountTask1: writingSubmission.wordCountTask1,
          wordCountTask2: writingSubmission.wordCountTask2,
          overallBand: writingSubmission.overallBand,
          aiTask1Overall: writingSubmission.aiTask1Overall,
          aiTask1TR: writingSubmission.aiTask1TR,
          aiTask1CC: writingSubmission.aiTask1CC,
          aiTask1LR: writingSubmission.aiTask1LR,
          aiTask1GRA: writingSubmission.aiTask1GRA,
          aiTask1Feedback: writingSubmission.aiTask1Feedback,
          aiTask2Overall: writingSubmission.aiTask2Overall,
          aiTask2TR: writingSubmission.aiTask2TR,
          aiTask2CC: writingSubmission.aiTask2CC,
          aiTask2LR: writingSubmission.aiTask2LR,
          aiTask2GRA: writingSubmission.aiTask2GRA,
          aiTask2Feedback: writingSubmission.aiTask2Feedback,
          aiScoredAt: writingSubmission.aiScoredAt,
        } : null,
      });
    }

    // TEACHER VIEW: Full review
    if (isTeacher) {
      // For JSON exams, answers are stored in attempt.answers, not in attempt_sections
      // Structure: { sectionType: { questionId: answer } }
      const allStudentAnswers = (attempt.answers as any) || {};
      const isIelts = examWithSections.category === "IELTS";
      const readingType: IeltsReadingType =
        (examWithSections.readingType || "ACADEMIC").toUpperCase() === "GENERAL_TRAINING"
          ? "GENERAL_TRAINING"
          : "ACADEMIC";
      
      // Process only parent sections (subsections will be included in their parents)
      const fullSections = parentSections.map((examSection: any) => {
        const attemptSection = attempt.sections.find(
          (as) => as.type === examSection.type
        );

        // Collect all questions from this section and its subsections.
        // IMPORTANT: some IELTS Reading passage subsections reuse question ids (e.g. "q1"),
        // so we must preserve the originating section type to fetch the correct answer
        // from attempt.answers[sectionType][questionId] without collisions.
        let allQuestions: Array<{ q: any; sourceSectionType: string }> = [
          ...(examSection.questions || []).map((q: any) => ({
            q,
            sourceSectionType: String(examSection.type),
          })),
        ];
        const sectionSubsections = subsectionsByParent[examSection.id] || [];
        sectionSubsections.forEach((sub: any) => {
          allQuestions = [
            ...allQuestions,
            ...(sub.questions || []).map((q: any) => ({
              q,
              sourceSectionType: String(sub.type),
            })),
          ];
        });
        
        // Sort by order
        allQuestions.sort((a, b) => (a.q?.order ?? 0) - (b.q?.order ?? 0));

        const questions = allQuestions.map(({ q, sourceSectionType }) => {
          const studentAnswer = attemptSection?.answers
            ? (attemptSection.answers as Record<string, any>)[q.id]
            : (allStudentAnswers[sourceSectionType] || {})[q.id];
          const answerKey = q.answerKey as any;


          // Use optimized helper function for correctness check
          const isCorrect = checkAnswerCorrectness(q, studentAnswer, answerKey);

          // Pre-compute task counts so the section can sum tasks (each HTML_CSS
          // field, each DND_GAP blank) instead of just questions.
          let taskCorrect: number;
          let taskTotal: number;
          if (q.qtype === "HTML_CSS") {
            const graded = gradeHtmlCssFields(studentAnswer, answerKey);
            if (graded.total > 0) {
              taskCorrect = graded.correct;
              taskTotal = graded.total;
            } else {
              taskCorrect = isCorrect ? 1 : 0;
              taskTotal = 1;
            }
          } else {
            taskCorrect = isCorrect ? 1 : 0;
            taskTotal = 1;
          }

            // Format answers for display
            let displayStudentAnswer = studentAnswer;
            let displayCorrectAnswer: any = answerKey;
            
            // For INLINE_SELECT, MCQ_SINGLE, SELECT: show text instead of index
            if (q.qtype === "INLINE_SELECT" || q.qtype === "MCQ_SINGLE" || q.qtype === "SELECT") {
              const choices = q.options?.choices || [];
              if (
                q.qtype === "INLINE_SELECT" &&
                studentAnswer &&
                typeof studentAnswer === "object" &&
                !Array.isArray(studentAnswer) &&
                Array.isArray(answerKey?.indices)
              ) {
                const promptText = (q.prompt as { text?: string })?.text || "";
                const blankCount = countInlineSelectBlanks(promptText);
                const blankChoices = getInlineSelectBlankChoices(q.options, blankCount);
                const toText = (indices: number[]) =>
                  indices
                    .map((idx, i) => (blankChoices[i] || choices)[idx] ?? `Option ${idx}`)
                    .join(" / ");
                displayStudentAnswer = toText(
                  Array.from({ length: blankCount }, (_, i) =>
                    Number((studentAnswer as Record<string, number>)[String(i)])
                  )
                );
                displayCorrectAnswer = toText(answerKey.indices);
              } else if (typeof studentAnswer === "number" && choices[studentAnswer] !== undefined) {
                displayStudentAnswer = choices[studentAnswer];
              } else if (typeof studentAnswer === "string") {
                displayStudentAnswer = studentAnswer;
              }
              if (
                typeof answerKey?.index === "number" &&
                choices[answerKey.index] &&
                !(q.qtype === "INLINE_SELECT" && Array.isArray(answerKey?.indices))
              ) {
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
            // For FILL_IN_BLANK: show the blanks array
            else if (q.qtype === "FILL_IN_BLANK") {
              displayCorrectAnswer = answerKey?.blanks || [];
            }
            // For TF / TF_NG: show value as text
            else if (q.qtype === "TF" || q.qtype === "TF_NG") {
              const formatTF = (val: any) => {
                if (val === true) return "True";
                if (val === false) return "False";
                if (typeof val === "string") {
                  const upper = val.toUpperCase();
                  if (upper === "TRUE") return "True";
                  if (upper === "FALSE") return "False";
                  if (upper === "NOT_GIVEN") return "Not Given";
                }
                return val;
              };
              displayStudentAnswer = formatTF(studentAnswer);
              displayCorrectAnswer = formatTF(answerKey?.value);
            }
            
            const prompt = q.prompt || {};
            return {
              id: q.id,
              qtype: q.qtype,
              prompt: {
                ...prompt,
                // Map top-level image to prompt.imageUrl for question components
                imageUrl: q.image || prompt.imageUrl || null,
              },
              options: q.options,
              order: q.order,
              maxScore: q.maxScore,
              image: q.image, // Include image for FILL_IN_BLANK
              studentAnswer: displayStudentAnswer,
              correctAnswer: displayCorrectAnswer,
              isCorrect,
              explanation: q.explanation,
              taskCorrect,
              taskTotal,
            };
          });

          // Helper function to count DND_GAP blanks (optimized)
          const countDndGapBlanks = (text: string): number => {
            // Fast path: count all ___ or ________ occurrences
            const matches = text.match(/___+|________+/g);
            return matches ? matches.length : 0;
          };
          
          // Count correct and total, but for DND_GAP count blanks (each blank = 1 task)
          let correctCount = 0;
          let totalCount = 0;
          
          questions.forEach((q: any) => {
            if (q.qtype === "DND_GAP" && q.prompt?.textWithBlanks) {
              // Optimized: directly count blanks without sentence splitting
              const totalBlanks = countDndGapBlanks(q.prompt.textWithBlanks);
              totalCount += (totalBlanks > 0 ? totalBlanks : 1);
              
              // Count correct blanks
              if (q.isCorrect) {
                // If entire question is correct, all blanks are correct
                correctCount += (totalBlanks > 0 ? totalBlanks : 1);
              } else {
                // Count how many individual blanks are correct
                const correctBlanks = q.correctAnswer || [];
                const studentAnswers = q.studentAnswer;
                
                if (studentAnswers && typeof studentAnswers === "object" && !Array.isArray(studentAnswers)) {
                  // Flatten student answers (optimized)
                  const studentAnswersFlat: string[] = [];
                  Object.keys(studentAnswers)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .forEach(sentenceIdx => {
                      const sentenceAnswers = studentAnswers[sentenceIdx];
                      if (Array.isArray(sentenceAnswers)) {
                        studentAnswersFlat.push(...sentenceAnswers.map(a => a ?? ""));
                      }
                    });
                  
                  // Count correct blanks (optimized)
                  if (Array.isArray(correctBlanks) && studentAnswersFlat.length === correctBlanks.length) {
                    correctCount += studentAnswersFlat.filter((v, i) => 
                      typeof v === "string" && 
                      typeof correctBlanks[i] === "string" &&
                      v.trim().toLowerCase() === correctBlanks[i].trim().toLowerCase()
                    ).length;
                  }
                }
              }
            } else if (typeof q.taskTotal === "number" && q.taskTotal > 1) {
              // HTML_CSS or other multi-field types: count each field as a task.
              totalCount += q.taskTotal;
              correctCount += typeof q.taskCorrect === "number" ? q.taskCorrect : 0;
            } else {
              // Regular question
              totalCount += 1;
              if (q.isCorrect) {
                correctCount += 1;
              }
            }
          });

          const bandScore = isIelts
            ? getIeltsBandForSection(examSection.type, correctCount, totalCount, { readingType })
            : null;

          return {
            type: examSection.type,
            title: examSection.title,
            correct: correctCount,
            total: totalCount,
            percentage: totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0,
            bandScore,
            questions,
          };
        });

      const totalCorrect = fullSections.reduce((sum, s) => sum + s.correct, 0);
      const totalQuestions = fullSections.reduce((sum, s) => sum + s.total, 0);
      const totalPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

      // Get writing submission if exists
      const writingSection = attempt.sections.find((s) => s.type === "WRITING");
      const writingSubmission = writingSection?.writingSubmission || null;

      const speakingSection = attempt.sections.find((s) => s.type === "SPEAKING");
      const speakingRubric = speakingSection?.rubric as { ieltsSpeakingAi?: Record<string, unknown> } | null;
      const speakingAi = speakingRubric?.ieltsSpeakingAi ?? null;

      // Overall IELTS band: blend Listening/Reading raw→band with AI Writing
      // and Speaking bands when available. Falls back to null for non-IELTS.
      const writingBandForOverall =
        writingSubmission?.overallBand ??
        (writingSubmission?.aiTask1Overall != null &&
        writingSubmission?.aiTask2Overall != null
          ? (writingSubmission.aiTask1Overall + writingSubmission.aiTask2Overall) / 2
          : null);
      const speakingBandForOverall =
        speakingAi && typeof (speakingAi as any).overallBand === "number"
          ? ((speakingAi as any).overallBand as number)
          : null;
      const overallBand = isIelts
        ? computeIeltsOverallBand([
            ...fullSections.map((s) => s.bandScore),
            writingBandForOverall ?? null,
            speakingBandForOverall ?? null,
          ])
        : null;

      return NextResponse.json({
        attemptId: attempt.id,
        examTitle: booking.exam.title,
        examCategory: examWithSections.category,
        studentName: booking.student.name || booking.student.email,
        submittedAt: attempt.submittedAt,
        status: attempt.status,
        role: "TEACHER",
        summary: {
          totalCorrect,
          totalQuestions,
          totalPercentage,
          overallBand,
        },
        sections: fullSections,
        speakingAi,
        writingSubmission: writingSubmission ? {
          id: writingSubmission.id,
          task1Response: writingSubmission.task1Response,
          task2Response: writingSubmission.task2Response,
          wordCountTask1: writingSubmission.wordCountTask1,
          wordCountTask2: writingSubmission.wordCountTask2,
          overallBand: writingSubmission.overallBand,
          aiTask1Overall: writingSubmission.aiTask1Overall,
          aiTask1TR: writingSubmission.aiTask1TR,
          aiTask1CC: writingSubmission.aiTask1CC,
          aiTask1LR: writingSubmission.aiTask1LR,
          aiTask1GRA: writingSubmission.aiTask1GRA,
          aiTask1Feedback: writingSubmission.aiTask1Feedback,
          aiTask2Overall: writingSubmission.aiTask2Overall,
          aiTask2TR: writingSubmission.aiTask2TR,
          aiTask2CC: writingSubmission.aiTask2CC,
          aiTask2LR: writingSubmission.aiTask2LR,
          aiTask2GRA: writingSubmission.aiTask2GRA,
          aiTask2Feedback: writingSubmission.aiTask2Feedback,
          aiScoredAt: writingSubmission.aiScoredAt,
        } : null,
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
