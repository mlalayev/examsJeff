import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { scoreSection } from "@/lib/scoring";

// GET /api/attempts/[id]/review - Get detailed review with correct/wrong answers
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    
    // Get attempt with all related data
    const attempt = await prisma.attempt.findUnique({
      where: { id: params.id },
      include: {
        sections: true,
        booking: {
          include: {
            exam: {
              include: {
                questions: {
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        }
      }
    });
    
    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found" },
        { status: 404 }
      );
    }
    
    // Verify ownership
    if (attempt.booking.studentId !== (user as any).id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Only allow review for submitted attempts
    if (attempt.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "Attempt must be submitted before review" },
        { status: 400 }
      );
    }
    
    const reviewData: any = {
      attemptId: attempt.id,
      status: attempt.status,
      submittedAt: attempt.submittedAt,
      bandOverall: attempt.bandOverall,
      sections: []
    };
    
    // Process each section
    for (const section of attempt.sections) {
      const sectionReview: any = {
        type: section.type,
        status: section.status,
        rawScore: section.rawScore,
        bandScore: section.bandScore,
        startedAt: section.startedAt,
        endedAt: section.endedAt,
      };
      
      // Only provide detailed review for Reading and Listening (auto-graded)
      if (section.type === 'READING' || section.type === 'LISTENING') {
        const questions = attempt.booking.exam.questions.filter(
          q => q.sectionType === section.type
        );
        
        const studentAnswers = (section.answers as any) || {};
        
        if (questions.length > 0) {
          const scoringResult = await scoreSection(questions, studentAnswers);
          
          // Map questions with review data
          sectionReview.questions = questions.map(q => {
            const review = scoringResult.breakdown.find(b => b.questionId === q.id);
            return {
              id: q.id,
              order: q.order,
              qtype: q.qtype,
              prompt: q.prompt,
              options: q.options,
              studentAnswer: review?.studentAnswer,
              correctAnswer: review?.correctAnswer,
              isCorrect: review?.isCorrect ?? false,
              points: review?.points ?? 0,
              maxScore: q.maxScore,
            };
          });
          
          sectionReview.summary = {
            correctCount: scoringResult.correctCount,
            totalQuestions: scoringResult.totalQuestions,
            rawScore: scoringResult.rawScore,
            maxRawScore: scoringResult.maxRawScore,
          };
        }
      } else {
        // Writing and Speaking - just show if graded
        if (section.bandScore !== null) {
          sectionReview.graded = true;
          sectionReview.feedback = section.feedback;
        } else {
          sectionReview.graded = false;
          sectionReview.message = "Pending teacher grading";
        }
      }
      
      reviewData.sections.push(sectionReview);
    }
    
    return NextResponse.json(reviewData);
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    
    console.error("Review attempt error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching review" },
      { status: 500 }
    );
  }
}

