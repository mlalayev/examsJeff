import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBranchAdmin, getScopedBranchId } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await requireBranchAdmin();
    const branchId = getScopedBranchId(user);
    
    if (!branchId) {
      return NextResponse.json({ error: "Branch ID not found" }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: {
        role: { in: ["STUDENT", "TEACHER"] },
        branchId: branchId,
        approved: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Branch admin approvals error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
