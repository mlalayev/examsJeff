import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTeacher();
    const { id: studentId } = await params;

    // Find all attempts for this student
    const attempts = await prisma.attempt.findMany({
      where: {
        OR: [
          { studentId },
          { booking: { studentId } },
          { assignment: { studentId } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        submittedAt: true,
        sections: {
          select: {
            type: true,
            rawScore: true,
            maxScore: true,
          },
        },
        booking: {
          select: {
            exam: {
              select: {
                id: true,
                title: true,
                category: true,
              },
            },
          },
        },
      },
    });

    // Calculate overall percentage for each attempt
    const data = attempts.map((a) => {
      const autoSections = a.sections.filter((s) => s.type !== "WRITING");
      const totalRaw = autoSections.reduce((acc, s) => acc + (s.rawScore || 0), 0);
      const totalMax = autoSections.reduce((acc, s) => acc + (s.maxScore || 0), 0);
      const percent = totalMax > 0 ? Math.round((totalRaw / totalMax) * 100) : null;

      return {
        id: a.id,
        status: a.status,
        createdAt: a.createdAt,
        submittedAt: a.submittedAt,
        overallPercent: percent,
        exam: a.booking?.exam || null,
        sections: a.sections.map((s) => ({
          type: s.type,
          rawScore: s.rawScore,
          maxScore: s.maxScore,
        })),
      };
    });

    return NextResponse.json({ attempts: data });
  } catch (error) {
    console.error("Get student attempts error:", error);
    return NextResponse.json({ error: "Failed to fetch attempts" }, { status: 500 });
  }
}

