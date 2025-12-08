import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Secret key to prevent unauthorized access
const SETUP_SECRET = process.env.SETUP_SECRET || "aimentor-setup-secret-2024";

/**
 * POST /api/setup/creator
 * Creates the CREATOR account
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

    const CREATOR_EMAIL = "creator@creator.com";
    const CREATOR_PASSWORD = "murad123";
    const CREATOR_NAME = "System Creator";

    // Check if creator already exists
    const existing = await prisma.user.findUnique({
      where: { email: CREATOR_EMAIL },
    });

    if (existing) {
      // Update existing user to be CREATOR
      const updated = await prisma.user.update({
        where: { email: CREATOR_EMAIL },
        data: {
          role: "CREATOR",
          approved: true,
          passwordHash: await bcrypt.hash(CREATOR_PASSWORD, 10),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Creator account updated",
        account: {
          email: CREATOR_EMAIL,
          password: CREATOR_PASSWORD,
          role: "CREATOR",
        },
      });
    }

    // Get or create default branch
    let branch = await prisma.branch.findFirst();
    if (!branch) {
      branch = await prisma.branch.create({
        data: { name: "Main Branch" },
      });
    }

    // Create creator account
    const creator = await prisma.user.create({
      data: {
        name: CREATOR_NAME,
        email: CREATOR_EMAIL,
        passwordHash: await bcrypt.hash(CREATOR_PASSWORD, 10),
        role: "CREATOR",
        approved: true,
        branchId: branch.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Creator account created successfully",
      account: {
        email: CREATOR_EMAIL,
        password: CREATOR_PASSWORD,
        role: "CREATOR",
      },
    });
  } catch (error) {
    console.error("Creator setup error:", error);
    return NextResponse.json(
      {
        error: "Failed to create creator account",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

