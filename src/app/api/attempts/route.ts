import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { z } from "zod";

const createAttemptSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
});

// POST /api/attempts - Create attempt from booking
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if ((user as any).role === "STUDENT" && !(user as any).approved) {
      return NextResponse.json({ error: "Approval required" }, { status: 403 });
    }
    const body = await request.json();
    
    const { assignmentId } = createAttemptSchema.parse(body);

    // Verify assignment exists and belongs to this user
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        unitExam: { include: { exam: { include: { sections: true } } } },
        attempt: true,
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (assignment.studentId !== (user as any).id) {
      return NextResponse.json({ error: "Not your assignment" }, { status: 403 });
    }

    // Window check
    const now = new Date();
    if (assignment.startAt && assignment.startAt > now) {
      return NextResponse.json({ error: "Assignment not started yet" }, { status: 403 });
    }
    if (assignment.dueAt && assignment.dueAt < now) {
      return NextResponse.json({ error: "Assignment window has passed" }, { status: 403 });
    }

    // Check if attempt already exists
    if (assignment.attempt) {
      return NextResponse.json(
        { error: "Attempt already exists for this assignment", attempt: assignment.attempt },
        { status: 400 }
      );
    }

    // Create attempt with sections based on UnitExam.exam.sections
    const attempt = await prisma.attempt.create({
      data: {
        assignmentId: assignment.id,
        branchId: (user as any).branchId ?? null,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        sections: {
          create: assignment.unitExam.exam.sections.map(section => ({
            type: section.type,
            status: "NOT_STARTED"
          }))
        }
      },
      include: {
        sections: true,
        assignment: true,
      }
    });
    
    return NextResponse.json({
      message: "Attempt created successfully",
      attempt
    }, { status: 201 });
    
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
    
    console.error("Create attempt error:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the attempt" },
      { status: 500 }
    );
  }
}

// GET /api/attempts?bookingId=xxx - Get attempt by booking
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    if ((user as any).role === "STUDENT" && !(user as any).approved) {
      return NextResponse.json({ error: "Approval required" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId");
    
    if (!assignmentId) {
      return NextResponse.json(
        { error: "assignmentId query parameter is required" },
        { status: 400 }
      );
    }
    
    const attempt = await prisma.attempt.findUnique({
      where: { assignmentId },
      include: {
        sections: {
          orderBy: {
            type: "asc"
          }
        },
        assignment: true,
      }
    });
    
    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found" },
        { status: 404 }
      );
    }
    
    // Verify ownership
    if (attempt.assignment?.studentId !== (user as any).id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ attempt });
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    
    console.error("Get attempt error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the attempt" },
      { status: 500 }
    );
  }
}

