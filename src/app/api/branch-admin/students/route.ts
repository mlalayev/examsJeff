import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBranchAdmin, getScopedBranchId } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await requireBranchAdmin();
    const branchId = getScopedBranchId(user);
    
    // Build where clause based on user role
    const whereClause: any = {
      role: "STUDENT",
      // Hide CREATOR accounts from everyone
      NOT: { role: "CREATOR" }
    };
    
    // If user has a specific branch, filter by it
    if (branchId) {
      whereClause.branchId = branchId;
    }
    // If BOSS/ADMIN, they can see all students (no branch filter)

    const students = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        approved: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ students });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Branch admin students error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
