import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all exams with their sections and question counts
    const exams = await prisma.exam.findMany({
      where: {
        isActive: true,
      },
      include: {
        sections: {
          include: {
            questions: {
              select: {
                id: true,
                qtype: true,
              },
            },
          },
        },
        _count: {
          select: {
            sections: true,
          },
        },
      },
      orderBy: [
        { category: "asc" },
        { track: "asc" },
        { title: "asc" },
      ],
    });

    // Group exams by category and track
    const grouped = exams.reduce((acc, exam) => {
      const category = exam.category;
      const track = exam.track || "General";
      
      if (!acc[category]) {
        acc[category] = {};
      }
      if (!acc[category][track]) {
        acc[category][track] = [];
      }
      
      // Calculate total questions and duration
      const totalQuestions = exam.sections.reduce((sum, sec) => sum + sec.questions.length, 0);
      const totalDuration = exam.sections.reduce((sum, sec) => sum + (sec.durationMin || 0), 0);
      
      acc[category][track].push({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        category: exam.category,
        track: exam.track,
        totalQuestions,
        totalDuration,
        sectionCount: exam._count.sections,
        sections: exam.sections.map(sec => ({
          type: sec.type,
          title: sec.title,
          durationMin: sec.durationMin,
          questionCount: sec.questions.length,
        })),
      });
      
      return acc;
    }, {} as Record<string, Record<string, any[]>>);

    return NextResponse.json({
      grouped,
      userRole: user.role,
    });
  } catch (error) {
    console.error("Catalog API error:", error);
    return NextResponse.json(
      { error: "Failed to load catalog" },
      { status: 500 }
    );
  }
}
