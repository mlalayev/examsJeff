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

    const { sectionType, answers } = body as { sectionType: string; answers: any };
    if (!sectionType) {
      console.error('Missing sectionType in save request');
      return NextResponse.json({ error: "sectionType required" }, { status: 400 });
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
      const currentAnswers = (attempt.answers as any) || {};
      const updatedAnswers = { ...currentAnswers, ...answers };

      console.log('Saving JSON exam answers:', { currentCount: Object.keys(currentAnswers).length, newCount: Object.keys(answers).length, totalCount: Object.keys(updatedAnswers).length });

      await prisma.attempt.update({
        where: { id: attemptId },
        data: { answers: updatedAnswers },
      });

      console.log('JSON exam answers saved successfully');
      return NextResponse.json({ success: true, updated: 1 });
    } else {
      // For DB exams, update attempt_section
      console.log('Saving DB exam section:', { sectionType, answersCount: Object.keys(answers).length });
      
      const updated = await prisma.attemptSection.updateMany({
        where: { attemptId, type: sectionType as any },
        data: { answers },
      });

      console.log('DB exam section saved:', { updated: updated.count });
      return NextResponse.json({ success: true, updated: updated.count });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isForbidden = message.toLowerCase().includes("forbidden") || message.toLowerCase().includes("unauthorized");
    if (isForbidden) return NextResponse.json({ error: message }, { status: 403 });
    console.error("Save attempt answers error:", error);
    return NextResponse.json({ error: "Failed to save answers" }, { status: 500 });
  }
}
