import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdminOrBranchAdmin } from "@/lib/auth-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { examId } = await params;
    const exam = await prisma.exam.findUnique({
      where: {
        id: examId,
        isActive: true,
      },
      include: {
        sections: {
          include: {
            questions: {
              select: {
                id: true,
                qtype: true,
                prompt: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error("Exam API error:", error);
    return NextResponse.json(
      { error: "Failed to load exam" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    await requireAdminOrBranchAdmin();
    const { examId } = await params;
    
    // Check if exam has bookings
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });
    
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }
    
    if (exam._count.bookings > 0) {
      return NextResponse.json(
        { error: `Cannot delete exam with ${exam._count.bookings} booking(s). Set inactive instead.` },
        { status: 400 }
      );
    }
    
    await prisma.exam.delete({
      where: { id: examId }
    });
    
    return NextResponse.json({ message: "Exam deleted successfully" });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Admin or Branch Admin access required" }, { status: 403 });
    }
    
    console.error("Delete exam error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
