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

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        branchId: branchId,
      },
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
