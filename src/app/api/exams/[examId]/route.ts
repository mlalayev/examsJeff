import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exam = await prisma.exam.findUnique({
      where: {
        id: params.examId,
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
