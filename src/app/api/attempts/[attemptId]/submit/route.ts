import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";
import { SectionType, QuestionType } from "@prisma/client";
import { scoreQuestion } from "@/lib/scoring";
import { scoreIELTSListening } from "@/lib/ielts-listening-scoring";
import { scoreIELTSReading } from "@/lib/ielts-reading-scoring";

type AnswersByQuestionId = Record<string, any>;

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const user = await requireStudent();
    const { attemptId } = await params;
    const studentId = (user as any).id as string;

    // Load attempt first (optimized with limited fields)
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        studentId: true,
        examId: true,
        status: true,
        answers: true, // For JSON exams
        sections: {
          select: {
            id: true,
            type: true,
            answers: true,
          },
        },
      },
    });
    
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }
    
    if (attempt.studentId !== studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Load exam with minimal required fields for scoring
    const examWithSections = await prisma.exam.findUnique({
      where: { id: attempt.examId },
      select: {
        id: true,
        category: true, // For IELTS-specific scoring
        sections: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            type: true,
            questions: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                qtype: true,
                answerKey: true,
                maxScore: true,
                order: true, // For IELTS Listening part grouping
              },
            },
          },
        },
      },
    });
    
    if (!examWithSections) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }
    
    if (!examWithSections.sections || examWithSections.sections.length === 0) {
      return NextResponse.json({ error: "Exam has no sections" }, { status: 404 });
    }

    // Map attempt section answers from database
    let answersByType: Record<string, AnswersByQuestionId> = {};
    
    // Check if this is a JSON exam (answers stored in attempt.answers field)
    const isJsonExam = attempt.sections.length === 0;
    
    console.log('Submit - Exam type:', { isJsonExam, sectionsCount: attempt.sections.length, hasAnswersField: !!attempt.answers });
    
    if (isJsonExam && attempt.answers) {
      // For JSON exams, answers are in attempt.answers: { LISTENING: { q1: ans1 }, READING: { q2: ans2 } }
      const allAnswers = attempt.answers as any;
      answersByType = { ...allAnswers };
      // Remove sectionStartTimes if present (not actual answers)
      delete answersByType.sectionStartTimes;
      console.log('Submit - JSON exam answers by type:', Object.keys(answersByType));
    } else {
      // For DB exams, answers are in attempt.sections
      for (const as of attempt.sections) {
        if (as.answers) {
          answersByType[as.type as string] = as.answers as AnswersByQuestionId;
        }
      }
      console.log('Submit - DB exam answers by type:', Object.keys(answersByType));
    }

    // Calculate scores for all sections
    let totalRaw = 0;
    let totalMax = 0;
    const sectionUpdates: Array<{
      sectionId: string;
      rawScore: number | null;
      maxScore: number;
      status: string;
      rubric?: any; // For IELTS Listening part scores
    }> = [];

    for (const section of examWithSections.sections) {
      const sectionType = section.type as string;
      const isWriting = sectionType.startsWith("WRITING");

      let sectionRaw = 0;
      let sectionMax = 0;
      let sectionRubric: any = undefined;

      // Get answers for this section
      const sectionAnswers = answersByType[sectionType] || {};
      
      console.log(`Submit - Section ${sectionType}: ${Object.keys(sectionAnswers).length} answers, ${section.questions.length} questions`);

      // IELTS Listening: Special 4-part scoring
      if (examWithSections.category === "IELTS" && sectionType === "LISTENING") {
        const listeningResult = scoreIELTSListening(
          section.questions.map(q => ({
            id: q.id,
            qtype: q.qtype as string,
            answerKey: q.answerKey,
            maxScore: q.maxScore || 1,
            order: q.order,
          })),
          sectionAnswers
        );
        
        sectionRaw = listeningResult.totalRaw;
        sectionMax = listeningResult.maxScore;
        sectionRubric = {
          listeningParts: listeningResult.sectionScores,
          totalRaw: listeningResult.totalRaw,
          maxScore: listeningResult.maxScore,
        };
        
        totalRaw += sectionRaw;
        totalMax += sectionMax;
      }
      // IELTS Reading: Special 3-passage scoring
      else if (examWithSections.category === "IELTS" && sectionType === "READING") {
        const readingResult = scoreIELTSReading(
          section.questions.map(q => ({
            id: q.id,
            qtype: q.qtype as string,
            answerKey: q.answerKey,
            maxScore: q.maxScore || 1,
            order: q.order,
          })),
          sectionAnswers
        );
        
        sectionRaw = readingResult.totalRawScore;
        sectionMax = readingResult.maxScore;
        sectionRubric = {
          passageScores: readingResult.passageScores,
          totalRawScore: readingResult.totalRawScore,
          maxScore: readingResult.maxScore,
        };
        
        totalRaw += sectionRaw;
        totalMax += sectionMax;
      }
      // For writing, don't auto-score; calculate maxScore but keep raw null
      else if (!isWriting) {
        for (const q of section.questions) {
          try {
            const qtype = q.qtype as QuestionType;
            // ESSAY: auto-accept (mark as correct) but don't give points
            if (qtype === "ESSAY") {
              // Count in maxScore but not in rawScore (auto-accept, no points)
              if (typeof q.maxScore === "number") {
                sectionMax += q.maxScore;
              } else {
                sectionMax += 1;
              }
              // Note: We're NOT adding to sectionRaw, so student gets 0 points but question shows as "answered"
              continue;
            }

            const answer = sectionAnswers[q.id];
            const correct = scoreQuestion(qtype, answer, q.answerKey);
            
            // Debug log for FILL_IN_BLANK
            if (qtype === "FILL_IN_BLANK") {
              console.log(`FILL_IN_BLANK question ${q.id}:`, {
                hasAnswer: !!answer,
                answer: JSON.stringify(answer),
                answerKey: JSON.stringify(q.answerKey),
                correct
              });
            }
            
            // Each question's maxScore may be >1; scale with correct (0/1)
            if (typeof q.maxScore === "number") {
              sectionRaw += correct ? q.maxScore : 0;
              sectionMax += q.maxScore;
            } else {
              sectionRaw += correct;
              sectionMax += 1;
            }
          } catch (qError) {
            console.error(`Error scoring question ${q.id}:`, qError);
            throw new Error(`Failed to score question ${q.id}: ${qError instanceof Error ? qError.message : 'Unknown error'}`);
          }
        }
        totalRaw += sectionRaw;
        totalMax += sectionMax;
      } else {
        // still compute maxScore for writing to show denominator across writing if needed
        for (const q of section.questions) {
          if (typeof q.maxScore === "number") sectionMax += q.maxScore;
          else sectionMax += 1;
        }
      }

      // Find attempt section ID
      const attemptSection = attempt.sections.find((as) => as.type === sectionType);
      if (attemptSection) {
        sectionUpdates.push({
          sectionId: attemptSection.id,
          rawScore: isWriting ? null : sectionRaw,
          maxScore: sectionMax || 0,
          status: "COMPLETED",
          rubric: sectionRubric, // IELTS Listening part scores
        });
      }
    }

    const overallPercent = totalMax > 0 ? (totalRaw / totalMax) * 100 : null;

    // Use transaction for atomic updates
    await prisma.$transaction(async (tx) => {
      // Update all attempt sections in batch
      const updatePromises = sectionUpdates.map((update) =>
        tx.attemptSection.update({
          where: { id: update.sectionId },
          data: {
            rawScore: update.rawScore,
            maxScore: update.maxScore,
            status: update.status,
            rubric: update.rubric || undefined, // IELTS Listening part scores
          },
        })
      );

      await Promise.all(updatePromises);

      // Update attempt status
      await tx.attempt.update({
        where: { id: attemptId },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
          bandOverall: overallPercent ?? undefined,
        },
      });
    });

    return NextResponse.json({ success: true, attemptId, resultsUrl: `/attempt/${attemptId}/results` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : "";
    const isForbidden = message.toLowerCase().includes("forbidden") || message.toLowerCase().includes("unauthorized");
    if (isForbidden) return NextResponse.json({ error: message }, { status: 403 });
    console.error("Submit attempt error:", error);
    console.error("Error stack:", stack);
    return NextResponse.json({ 
      error: "Failed to submit attempt", 
      details: message,
      stack: process.env.NODE_ENV === 'development' ? stack : undefined 
    }, { status: 500 });
  }
}

