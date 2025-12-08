import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/setup/check
 * Checks database connection and setup status
 */
export async function GET() {
  try {
    // Check database connection
    await prisma.$connect();

    // Check for branches
    const branchCount = await prisma.branch.count();
    const branches = await prisma.branch.findMany({
      select: { id: true, name: true },
      take: 10,
    });

    // Check for users
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        approved: true,
      },
      take: 5,
    });

    // Check for creator account
    const creator = await prisma.user.findUnique({
      where: { email: "creator@creator.com" },
      select: {
        id: true,
        email: true,
        role: true,
        approved: true,
      },
    });

    return NextResponse.json({
      success: true,
      database: "Connected",
      stats: {
        branches: branchCount,
        users: userCount,
      },
      data: {
        branches: branches.map((b) => ({ id: b.id, name: b.name })),
        recentUsers: users.map((u) => ({
          email: u.email,
          role: u.role,
          approved: u.approved,
        })),
      },
      creator: creator
        ? {
            exists: true,
            role: creator.role,
            approved: creator.approved,
          }
        : {
            exists: false,
            message: "Creator account not found. Call POST /api/setup/creator?secret=... to create it",
          },
    });
  } catch (error) {
    console.error("Setup check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : String(error),
        message: "Make sure DATABASE_URL is set correctly in your environment variables",
      },
      { status: 500 }
    );
  }
}

