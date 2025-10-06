import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/attempts/[id]/submit - Submit entire attempt
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    
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
    
    // Check if already submitted
    if (attempt.status === "SUBMITTED") {
      return NextResponse.json(
        { error: "Attempt has already been submitted" },
        { status: 400 }
      );
    }
    
    // End any sections that are still in progress
    const now = new Date();
    const sectionUpdates = attempt.sections
      .filter(s => s.status !== "COMPLETED")
      .map(section =>
        prisma.attemptSection.update({
          where: { id: section.id },
          data: {
            status: "COMPLETED",
            endedAt: section.endedAt || now
          }
        })
      );
    
    await Promise.all(sectionUpdates);
    
    // Submit attempt
    const updatedAttempt = await prisma.attempt.update({
      where: { id: params.id },
      data: {
        status: "SUBMITTED",
        submittedAt: now
      },
      include: {
        sections: true,
        booking: {
          include: {
            exam: true
          }
        }
      }
    });
    
    // Update booking status
    await prisma.booking.update({
      where: { id: attempt.bookingId },
      data: {
        status: "COMPLETED"
      }
    });
    
    return NextResponse.json({
      message: "Attempt submitted successfully",
      attempt: updatedAttempt
    });
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    
    console.error("Submit attempt error:", error);
    return NextResponse.json(
      { error: "An error occurred while submitting the attempt" },
      { status: 500 }
    );
  }
}

