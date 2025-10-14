import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { z } from "zod";

const endSectionSchema = z.object({
  sectionType: z.enum(["READING", "LISTENING", "WRITING", "SPEAKING"]),
});

// PATCH /api/attempts/[id]/section/end - End/lock a section
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    const validatedData = endSectionSchema.parse(body);
    
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
    
    // Check if section is already ended
    if (section.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Section has already been completed" },
        { status: 400 }
      );
    }
    
    // End section
    const updatedSection = await prisma.attemptSection.update({
      where: { id: section.id },
      data: {
        status: "COMPLETED",
        endedAt: new Date()
      }
    });
    
    return NextResponse.json({
      message: "Section ended successfully",
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
    
    console.error("End section error:", error);
    return NextResponse.json(
      { error: "An error occurred while ending the section" },
      { status: 500 }
    );
  }
}

