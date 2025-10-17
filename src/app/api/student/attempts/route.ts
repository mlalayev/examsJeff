import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await requireStudent();
    const studentId = (user as any).id as string;

    const attempts = await prisma.attempt.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: {
        sections: true,
        booking: { 
          select: { 
            id: true, 
            exam: { select: { id: true, title: true, category: true, track: true } },
            class: { 
              select: { 
                id: true, 
                name: true, 
                teacher: { select: { id: true, name: true } } 
              } 
            } 
          } 
        },
        assignment: true,
      },
    });

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
        class: a.booking?.class || null,
        sections: a.sections.map((s) => ({ type: s.type, rawScore: s.rawScore, maxScore: s.maxScore })),
      };
    });

    return NextResponse.json({ attempts: data });
  } catch (error) {
    console.error("Student attempts history error:", error);
    return NextResponse.json({ error: "Failed to load attempts" }, { status: 500 });
  }
}
