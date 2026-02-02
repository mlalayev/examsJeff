import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

/**
 * Helper function to check if a student answer is correct
 * Optimized and reusable for both student and teacher views
 */
function checkAnswerCorrectness(q: any, studentAnswer: any, answerKey: any): boolean {
  if (q.qtype === "TF") {
    const correctBool = answerKey?.value;
    return studentAnswer === (correctBool === true ? 0 : 1);
  } else if (q.qtype === "MCQ_SINGLE" || q.qtype === "SELECT" || q.qtype === "INLINE_SELECT") {
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
    // IELTS Fill in the Blank: { "0": "answer1", "1": "answer2", ... }
    // answerKey format: { answers: [["alt1", "alt2"], ["alt3"], ...] }
    const correctAnswers = answerKey?.answers || [];
    
    if (!studentAnswer || typeof studentAnswer !== "object") return false;
    
    // Check each blank
    for (let i = 0; i < correctAnswers.length; i++) {
      const studentAns = studentAnswer[String(i)];
      if (!studentAns || typeof studentAns !== "string") return false;
      
      const alternatives = correctAnswers[i];
      
      // Handle both old format (string) and new format (array of strings)
      const alternativesArray = Array.isArray(alternatives) ? alternatives : [alternatives];
      
      if (!Array.isArray(alternativesArray) || alternativesArray.length === 0) return false;
      
      // Normalize student answer (trim + lowercase)
      const normalizedStudent = studentAns.trim().toLowerCase();
      
      // Check if student answer matches any alternative
      const isMatch = alternativesArray.some((alt: string | string[]) => {
        // Handle nested arrays (backward compatibility)
        if (Array.isArray(alt)) {
          return alt.some((a: string) => {
            if (typeof a !== "string") return false;
            return a.trim().toLowerCase() === normalizedStudent;
          });
        }
        
        if (typeof alt !== "string") return false;
        return alt.trim().toLowerCase() === normalizedStudent;
      });
      
      if (!isMatch) return false;
    }
    
    return true;
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
        sections: true,
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
    
    // Group sections: parent sections with their subsections
    const parentSections = examWithSections.sections.filter((s: any) => !s.parentSectionId);
    const subsectionsByParent = examWithSections.sections
      .filter((s: any) => s.parentSectionId)
      .reduce((acc: any, sub: any) => {
        if (!acc[sub.parentSectionId]) acc[sub.parentSectionId] = [];
        acc[sub.parentSectionId].push(sub);
        return acc;
      }, {});

    // STUDENT VIEW: Summary only
    if (role === "STUDENT" && isOwner) {
      // For JSON exams, we may not have attempt.sections in DB, so compute from answers
      // Structure: { sectionType: { questionId: answer } }
      const allStudentAnswers = (attempt.answers as any) || {};
      
      const perSection = parentSections.map((examSection: any) => {
        const attemptSec = attempt.sections.find((as) => as.type === examSection.type);
        
        // Collect all questions from this section and its subsections
        let allQuestions = [...(examSection.questions || [])];
        const sectionSubsections = subsectionsByParent[examSection.id] || [];
        sectionSubsections.forEach((sub: any) => {
          allQuestions = [...allQuestions, ...(sub.questions || [])];
        });
        
        const totalQuestions = allQuestions.length;
        
        // Get answers for this specific section
        const studentAnswers = (attemptSec?.answers as Record<string, any>) || allStudentAnswers[examSection.type] || {};
        
        let correctCount = 0;
        if (attemptSec && attemptSec.rawScore !== null) {
          // Use DB score if available
          correctCount = attemptSec.rawScore;
        } else {
          // Compute score from answers (for JSON exams) - using optimized helper function
          correctCount = allQuestions.filter((q: any) => {
            const studentAnswer = studentAnswers[q.id];
            const answerKey = q.answerKey as any;
            return checkAnswerCorrectness(q, studentAnswer, answerKey);
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
        examTitle: booking.exam.title,
        studentName: booking.student.name || booking.student.email,
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
      
      console.log('🎯 TEACHER VIEW - Raw attempt.answers structure:', {
        attemptId: attempt.id,
        hasAnswers: !!attempt.answers,
        answersKeys: Object.keys(allStudentAnswers),
        fullAnswersPreview: JSON.stringify(allStudentAnswers).substring(0, 500),
      });
      
      // Process only parent sections (subsections will be included in their parents)
      const fullSections = parentSections.map((examSection: any) => {
        const attemptSection = attempt.sections.find(
          (as) => as.type === examSection.type
        );

        // Collect all questions from this section and its subsections
        let allQuestions = [...(examSection.questions || [])];
        const sectionSubsections = subsectionsByParent[examSection.id] || [];
        sectionSubsections.forEach((sub: any) => {
          allQuestions = [...allQuestions, ...(sub.questions || [])];
        });

        // Collect student answers from parent section AND all subsections
        // For JSON exams: answers are in allStudentAnswers[sectionType]
        // For DB exams: answers are in attemptSection.answers
        let studentAnswers: Record<string, any> = {};
        
        console.log(`🔍 Collecting answers for section ${examSection.type}:`, {
          examSectionId: examSection.id,
          examSectionType: examSection.type,
          hasAttemptSection: !!attemptSection,
          attemptSectionAnswers: attemptSection?.answers,
          attemptSectionAnswersJSON: JSON.stringify(attemptSection?.answers || {}),
          allStudentAnswersKeys: Object.keys(allStudentAnswers),
          allStudentAnswersPreview: JSON.stringify(allStudentAnswers).substring(0, 1000),
          subsectionsCount: sectionSubsections.length,
          subsectionTypes: sectionSubsections.map((s: any) => s.type),
        });
          
        if (attemptSection?.answers) {
          // DB exam: use attemptSection.answers
          studentAnswers = { ...(attemptSection.answers as Record<string, any>) };
          console.log(`📦 DB exam - using attemptSection.answers:`, {
            count: Object.keys(studentAnswers).length,
            keys: Object.keys(studentAnswers),
            sample: Object.entries(studentAnswers).slice(0, 3).map(([k, v]) => ({ key: k, value: v, type: typeof v }))
          });
        } else {
          // JSON exam: collect from parent section and all subsections
          studentAnswers = { ...(allStudentAnswers[examSection.type] || {}) };
          console.log(`📦 JSON exam - parent section ${examSection.type}:`, {
            count: Object.keys(studentAnswers).length,
            keys: Object.keys(studentAnswers),
            sample: Object.entries(studentAnswers).slice(0, 3).map(([k, v]) => ({ key: k, value: v, type: typeof v }))
          });
          
          // Also collect answers from subsections
          sectionSubsections.forEach((sub: any) => {
            const subAnswers = allStudentAnswers[sub.type] || {};
            console.log(`📦 Adding subsection ${sub.type}:`, {
              count: Object.keys(subAnswers).length,
              keys: Object.keys(subAnswers),
              sample: Object.entries(subAnswers).slice(0, 3).map(([k, v]) => ({ key: k, value: v, type: typeof v }))
            });
            studentAnswers = { ...studentAnswers, ...subAnswers };
          });
          
          console.log(`✅ Total collected answers:`, {
            count: Object.keys(studentAnswers).length,
            allKeys: Object.keys(studentAnswers)
          });
        }
        
        // Sort by order
        allQuestions.sort((a: any, b: any) => a.order - b.order);

        const questions = allQuestions.map((q: any) => {
          const studentAnswer = studentAnswers[q.id];
          const answerKey = q.answerKey as any;

          // Debug logging for all questions
          if (q.qtype === "FILL_IN_BLANK") {
            console.log(`📝 FILL_IN_BLANK Question ${q.id}:`, {
              questionId: q.id,
              hasStudentAnswer: !!studentAnswer,
              studentAnswerRaw: studentAnswer,
              studentAnswerType: typeof studentAnswer,
              studentAnswerKeys: studentAnswer && typeof studentAnswer === 'object' ? Object.keys(studentAnswer) : [],
              studentAnswerValues: studentAnswer && typeof studentAnswer === 'object' ? Object.values(studentAnswer) : [],
              studentAnswerJSON: JSON.stringify(studentAnswer),
              allAvailableAnswerKeys: Object.keys(studentAnswers).slice(0, 10), // First 10 keys
              answerKeyFormat: answerKey,
            });
          }

          // Use optimized helper function for correctness check
          const isCorrect = checkAnswerCorrectness(q, studentAnswer, answerKey);

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
            // For FILL_IN_BLANK: show the answers with alternatives
            else if (q.qtype === "FILL_IN_BLANK") {
              displayCorrectAnswer = answerKey?.answers || [];
              // Keep student answer as is (it's already an object like { "0": "answer1", "1": "answer2" })
              // But make sure it's not undefined/null
              if (!displayStudentAnswer) {
                console.log(`⚠️ FILL_IN_BLANK ${q.id} has no student answer!`, {
                  studentAnswer,
                  displayStudentAnswer,
                });
              }
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
            } else {
              // Regular question
              totalCount += 1;
              if (q.isCorrect) {
                correctCount += 1;
              }
            }
          });

          return {
            type: examSection.type,
            title: examSection.title,
            correct: correctCount,
            total: totalCount,
            percentage: totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0,
            questions,
            // IELTS Listening: Include part scores from rubric
            listeningParts: attemptSection?.rubric?.listeningParts || undefined,
          };
        });

      const totalCorrect = fullSections.reduce((sum, s) => sum + s.correct, 0);
      const totalQuestions = fullSections.reduce((sum, s) => sum + s.total, 0);
      const totalPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

      console.log('📊 Teacher view - sections:', fullSections.map(s => ({ 
        type: s.type, 
        questionsCount: s.questions?.length,
        correct: s.correct,
        total: s.total
      })));

      return NextResponse.json({
        attemptId: attempt.id,
        examTitle: booking.exam.title,
        studentName: booking.student.name || booking.student.email,
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
