import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const user = await requireStudent();
    const { attemptId } = await params;
    const studentId = (user as any).id as string;
    const body = await request.json();

    console.log('Save attempt request:', { attemptId, studentId, bodyKeys: Object.keys(body) });

    const { sectionType, answers, sectionStartTimes } = body as { 
      sectionType?: string; 
      answers?: any;
      sectionStartTimes?: Record<string, number>;
    };
    
    // Allow saving just sectionStartTimes without sectionType
    if (!sectionType && !sectionStartTimes) {
      console.error('Missing sectionType or sectionStartTimes in save request');
      return NextResponse.json({ error: "sectionType or sectionStartTimes required" }, { status: 400 });
    }

    const attempt = await prisma.attempt.findUnique({ 
      where: { id: attemptId },
      include: {
        sections: true,
      }
    });
    
    if (!attempt) {
      console.error('Attempt not found:', attemptId);
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }
    
    if (attempt.studentId !== studentId) {
      console.error('Student ID mismatch:', { attemptStudent: attempt.studentId, requestStudent: studentId });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if this is a JSON exam (no attempt_sections in DB)
    const isJsonExam = attempt.sections.length === 0;
    console.log('Save attempt:', { attemptId, sectionType, isJsonExam, sectionsCount: attempt.sections.length, answersCount: Object.keys(answers || {}).length });

    if (isJsonExam) {
      // For JSON exams, merge answers into attempt.answers
      // Structure: { sectionType1: { q1: answer1, q2: answer2 }, sectionType2: { q3: answer3 }, sectionStartTimes: {...} }
      const currentAnswers = (attempt.answers as any) || {};
      
      let updatedAnswers = { ...currentAnswers };
      
      // Update section answers if provided
      if (sectionType && answers) {
        updatedAnswers = {
          ...updatedAnswers,
          [sectionType]: { 
            ...(currentAnswers[sectionType] || {}), 
            ...answers 
          }
        };
      }
      
      // Update section start times if provided
      if (sectionStartTimes) {
        updatedAnswers = {
          ...updatedAnswers,
          sectionStartTimes: {
            ...(currentAnswers.sectionStartTimes || {}),
            ...sectionStartTimes
          }
        };
      }

      console.log('Saving JSON exam data:', { 
        sectionType, 
        hasAnswers: !!answers,
        hasTimes: !!sectionStartTimes,
        answersCount: answers ? Object.keys(answers).length : 0
      });

      await prisma.attempt.update({
        where: { id: attemptId },
        data: { answers: updatedAnswers },
      });

      console.log('JSON exam data saved successfully');
      return NextResponse.json({ success: true, updated: 1 });
    } else {
      // For DB exams, update attempt_section
      console.log('Saving DB exam section:', { sectionType, answersCount: Object.keys(answers || {}).length });
      
      // Ensure answers is not null/undefined
      if (!answers) {
        console.warn('No answers to save for section:', sectionType);
        return NextResponse.json({ success: true, updated: 0 });
      }
      
      const updated = await prisma.attemptSection.updateMany({
        where: { attemptId, type: sectionType as any },
        data: { answers },
      });

      console.log('DB exam section saved:', { updated: updated.count, sectionType });
      
      if (updated.count === 0) {
        console.warn('No attempt_section found to update:', { attemptId, sectionType });
      }
      
      return NextResponse.json({ success: true, updated: updated.count });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : "";
    const isForbidden = message.toLowerCase().includes("forbidden") || message.toLowerCase().includes("unauthorized");
    if (isForbidden) return NextResponse.json({ error: message }, { status: 403 });
    console.error("Save attempt answers error:", { error, message, stack });
    return NextResponse.json({ error: `Failed to save answers: ${message}` }, { status: 500 });
  }
}
