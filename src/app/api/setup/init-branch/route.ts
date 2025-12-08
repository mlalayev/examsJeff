import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SETUP_SECRET = process.env.SETUP_SECRET || "aimentor-setup-secret-2024";

/**
 * POST /api/setup/init-branch
 * Creates a default branch if none exists
 * Requires secret query parameter
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    // Verify secret
    if (secret !== SETUP_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid setup secret" },
        { status: 401 }
      );
    }

    // Check if any branch exists
    const branchCount = await prisma.branch.count();

    if (branchCount > 0) {
      const branches = await prisma.branch.findMany({
        select: { id: true, name: true },
      });
      return NextResponse.json({
        success: true,
        message: "Branches already exist",
        branches,
      });
    }

    // Create default branch
    const branch = await prisma.branch.create({
      data: { name: "Main Branch" },
    });

    return NextResponse.json({
      success: true,
      message: "Default branch created",
      branch: {
        id: branch.id,
        name: branch.name,
      },
    });
  } catch (error) {
    console.error("Branch init error:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize branch",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

