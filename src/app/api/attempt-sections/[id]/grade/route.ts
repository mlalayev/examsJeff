import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { calculateOverallBand } from "@/lib/scoring";
import { z } from "zod";

const gradeSchema = z.object({
  bandScore: z.number()
    .min(0, "Band score must be at least 0")
    .max(9, "Band score must be at most 9")
    .refine(
      (val) => val % 0.5 === 0,
      "Band score must be in 0.5 steps (e.g., 6.0, 6.5, 7.0)"
    ),
  rubric: z.record(z.any()).optional(),
  feedback: z.string().max(5000, "Feedback is too long").optional(),
});

// POST /api/attempt-sections/[id]/grade - Submit grade for Writing/Speaking section
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireTeacher();
    const teacherId = (user as any).id;
    
    const body = await request.json();
    const validatedData = gradeSchema.parse(body);
    
    // Get section with related data
    const section = await prisma.attemptSection.findUnique({
      where: { id: params.id },
      include: {
        attempt: {
          include: {
            sections: true,
            booking: {
              include: {
                exam: {
                  select: {
                    examType: true,
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!section) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }
    
    // Verify teacher owns this booking
    if (section.attempt.booking.teacherId !== teacherId) {
      return NextResponse.json(
        { error: "Unauthorized - not your student" },
        { status: 403 }
      );
    }
    
    // Only allow grading Writing and Speaking
    if (section.type !== "WRITING" && section.type !== "SPEAKING") {
      return NextResponse.json(
        { error: "Only Writing and Speaking sections can be manually graded" },
        { status: 400 }
      );
    }
    
    // Update section with grade
    const updatedSection = await prisma.attemptSection.update({
      where: { id: params.id },
      data: {
        bandScore: validatedData.bandScore,
        rubric: validatedData.rubric || undefined,
        feedback: validatedData.feedback || undefined,
        gradedById: teacherId,
      }
    });
    
    // Check if all sections are now graded
    const allSections = section.attempt.sections;
    const allGraded = allSections.every(s => {
      if (s.id === params.id) {
        // This section was just graded
        return true;
      }
      return s.bandScore !== null;
    });
    
    let overallBand = section.attempt.bandOverall;
    
    if (allGraded) {
      // Recalculate overall band
      const sectionBands = allSections.map(s => {
        if (s.id === params.id) {
          return validatedData.bandScore;
        }
        return s.bandScore!;
      });
      
      overallBand = calculateOverallBand(sectionBands);
      
      // Update attempt with new overall band
      await prisma.attempt.update({
        where: { id: section.attemptId },
        data: {
          bandOverall: overallBand,
        }
      });
      
      console.log(`Attempt ${section.attemptId} fully graded. Overall band: ${overallBand}`);
    }
    
    return NextResponse.json({
      message: "Section graded successfully",
      section: updatedSection,
      allGraded,
      overallBand,
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Teachers only" }, { status: 403 });
      }
    }
    
    console.error("Grade section error:", error);
    return NextResponse.json(
      { error: "An error occurred while grading section" },
      { status: 500 }
    );
  }
}

