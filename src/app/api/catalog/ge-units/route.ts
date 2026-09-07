import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ENGLISH_LEVEL_IDS } from "@/lib/english-levels";

/**
 * GET /api/catalog/ge-units?level=A2
 * Returns unit exams for a given General English level
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level");

    if (!level) {
      return NextResponse.json(
        { error: "Level parameter is required" },
        { status: 400 }
      );
    }

    // Validate level
    const validLevels: readonly string[] = ENGLISH_LEVEL_IDS;
    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { error: "Invalid level" },
        { status: 400 }
      );
    }

    // Fetch exams for this level
    const exams = await prisma.exam.findMany({
      where: {
        category: "GENERAL_ENGLISH",
        track: level,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        track: true,
        createdAt: true,
      },
      orderBy: {
        title: "asc",
      },
    });

    return NextResponse.json({ units: exams });
  } catch (error: any) {
    console.error("Error fetching GE units:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch units" },
      { status: 500 }
    );
  }
}

