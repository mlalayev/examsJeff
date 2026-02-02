import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

/**
 * POST /api/attempts/:attemptId/update-answer
 * Update a student's answer for a specific question
 * Only accessible by TEACHER, ADMIN, or BOSS
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await requireAuth();
    const { attemptId } = await params;
    
    // Only allow teachers, admins, and bosses to edit
    if (!["TEACHER", "ADMIN", "BOSS"].includes(user.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Only teachers and admins can edit student answers." },
        { status: 403 }
      );
    }

    const { sectionType, questionId, answer } = await req.json();

    if (!sectionType || !questionId) {
      return NextResponse.json(
        { error: "Missing required fields: sectionType, questionId" },
        { status: 400 }
      );
    }

    // Fetch the attempt
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        sections: true,
        booking: {
          include: {
            exam: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Determine if this is a JSON exam or DB exam
    const isJsonExam = attempt.booking?.exam?.questions !== null;

    if (isJsonExam) {
      // For JSON exams, update attempt.answers
      // Structure: { sectionType1: { q1: answer1, q2: answer2 }, sectionType2: { q3: answer3 } }
      const currentAnswers = (attempt.answers as any) || {};
      
      console.log('🔄 BEFORE UPDATE:', {
        attemptId,
        sectionType,
        questionId,
        currentAnswersForSection: currentAnswers[sectionType],
        currentAnswerForQuestion: currentAnswers[sectionType]?.[questionId],
        newAnswer: answer,
        newAnswerType: typeof answer,
        newAnswerJSON: JSON.stringify(answer),
      });
      
      const updatedAnswers = {
        ...currentAnswers,
        [sectionType]: {
          ...(currentAnswers[sectionType] || {}),
          [questionId]: answer,
        },
      };

      await prisma.attempt.update({
        where: { id: attemptId },
        data: { answers: updatedAnswers },
      });

      console.log('✅ AFTER UPDATE - Updated JSON exam answer:', { 
        attemptId, 
        sectionType, 
        questionId, 
        answer,
        answerType: typeof answer,
        answerJSON: JSON.stringify(answer),
        updatedSectionAnswers: updatedAnswers[sectionType],
        updatedQuestionAnswer: updatedAnswers[sectionType][questionId]
      });
    } else {
      // For DB exams, update attempt_section.answers
      const attemptSection = attempt.sections.find((s) => s.type === sectionType);
      
      if (!attemptSection) {
        return NextResponse.json(
          { error: `Section ${sectionType} not found in attempt` },
          { status: 404 }
        );
      }

      const currentAnswers = (attemptSection.answers as any) || {};
      
      console.log('🔄 DB EXAM BEFORE UPDATE:', {
        attemptId,
        sectionType,
        questionId,
        currentAnswers,
        currentAnswerForQuestion: currentAnswers[questionId],
        newAnswer: answer,
        newAnswerType: typeof answer,
        newAnswerJSON: JSON.stringify(answer),
      });
      
      const updatedAnswers = {
        ...currentAnswers,
        [questionId]: answer,
      };

      await prisma.attemptSection.update({
        where: { id: attemptSection.id },
        data: { answers: updatedAnswers },
      });

      console.log('✅ DB EXAM AFTER UPDATE:', { 
        attemptId, 
        sectionType, 
        questionId, 
        answer,
        answerType: typeof answer,
        answerJSON: JSON.stringify(answer),
        updatedAnswers,
        updatedQuestionAnswer: updatedAnswers[questionId]
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating answer:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

