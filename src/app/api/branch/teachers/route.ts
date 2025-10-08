import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBranchAdmin, getScopedBranchId } from "@/lib/auth-utils";

// GET /api/branch/teachers - Get teachers in the branch (for assignment dropdown)
export async function GET(request: Request) {
  try {
    const user = await requireBranchAdmin();
    const branchId = getScopedBranchId(user);

    const whereClause: any = {
      role: "TEACHER",
      approved: true, // Only approved teachers
    };

    // Branch scoping
    if (branchId) {
      whereClause.branchId = branchId;
    }

    const teachers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ teachers });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Branch teachers error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
