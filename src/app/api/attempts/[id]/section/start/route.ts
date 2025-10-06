import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { z } from "zod";

const startSectionSchema = z.object({
  sectionType: z.enum(["READING", "LISTENING", "WRITING", "SPEAKING"]),
});

// PATCH /api/attempts/[id]/section/start - Start a section
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    const validatedData = startSectionSchema.parse(body);
    
    // Get attempt and verify ownership
    const attempt = await prisma.attempt.findUnique({
      where: { id: params.id },
      include: {
        booking: {
          include: {
            exam: {
              include: {
                sections: true
              }
            }
          }
        },
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
    
    // Check if attempt is still in progress
    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Attempt is not in progress" },
        { status: 400 }
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
    
    // Check if section is already started or ended
    if (section.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Section has already been completed" },
        { status: 400 }
      );
    }
    
    // Get duration from exam section
    const examSection = attempt.booking.exam.sections.find(
      s => s.type === validatedData.sectionType
    );
    
    if (!examSection) {
      return NextResponse.json(
        { error: "Exam section not found" },
        { status: 404 }
      );
    }
    
    // Update section
    const updatedSection = await prisma.attemptSection.update({
      where: { id: section.id },
      data: {
        status: "IN_PROGRESS",
        startedAt: section.startedAt || new Date() // Only set if not already started
      }
    });
    
    return NextResponse.json({
      message: "Section started successfully",
      section: updatedSection,
      durationMin: examSection.durationMin
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
    
    console.error("Start section error:", error);
    return NextResponse.json(
      { error: "An error occurred while starting the section" },
      { status: 500 }
    );
  }
}

