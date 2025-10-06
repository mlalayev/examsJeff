import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { z } from "zod";

const saveSectionSchema = z.object({
  sectionType: z.enum(["READING", "LISTENING", "WRITING", "SPEAKING"]),
  answers: z.any(), // JSON - flexible structure
});

// PATCH /api/attempts/[id]/section/save - Autosave answers
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    const validatedData = saveSectionSchema.parse(body);
    
    // Get attempt and verify ownership
    const attempt = await prisma.attempt.findUnique({
      where: { id: params.id },
      include: {
        booking: true,
        sections: true
      }
    });
    
    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found" },
        { status: 404 }
      );
    }
    
    if (attempt.booking.studentId !== (user as any).id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Find the section
    const section = attempt.sections.find(s => s.type === validatedData.sectionType);
    
    if (!section) {
      return NextResponse.json(
        { error: "Section not found in this attempt" },
        { status: 404 }
      );
    }
    
    // Check if section is ended
    if (section.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Section has been completed and cannot be modified" },
        { status: 400 }
      );
    }
    
    // Save answers
    const updatedSection = await prisma.attemptSection.update({
      where: { id: section.id },
      data: {
        answers: validatedData.answers
      }
    });
    
    return NextResponse.json({
      message: "Answers saved successfully",
      section: updatedSection
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    
    console.error("Save section error:", error);
    return NextResponse.json(
      { error: "An error occurred while saving answers" },
      { status: 500 }
    );
  }
}

