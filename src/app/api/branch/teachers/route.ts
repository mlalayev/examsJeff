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
      // Hide CREATOR accounts from everyone
      NOT: { role: "CREATOR" }
    };

    // Branch scoping
    const selectedBranch = new URL(request.url).searchParams.get("branchId");
    if (["BRANCH_ADMIN", "BRANCH_BOSS"].includes((user as any).role) && !branchId) return NextResponse.json({error:"Forbidden"},{status:403});
    if (selectedBranch) whereClause.branchId = selectedBranch;
    if (branchId) {
      whereClause.branchId = branchId;
    }

    const teachers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true, lastName: true,
        email: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return NextResponse.json({ teachers: teachers.map(t=>({...t,name:[t.firstName,t.lastName].filter(Boolean).join(" ") || t.email})) });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Branch teachers error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
