import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBranchAdmin, getScopedBranchId } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await requireBranchAdmin();
    const branchId = getScopedBranchId(user);
    
    // Build where clause based on user role
    const branchFilter = branchId ? { branchId } : {};
    
    // Get branch name if applicable
    let branchName = null;
    if (branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { name: true },
      });
      branchName = branch?.name;
    }

    const now = new Date();

    // Get total counts for the branch
    const [totalStudents, totalTeachers, activeClasses, pendingApprovals] = await Promise.all([
      prisma.user.count({
        where: {
          role: "STUDENT",
          ...branchFilter,
          NOT: { role: "CREATOR" }
        },
      }),
      prisma.user.count({
        where: {
          role: "TEACHER",
          ...branchFilter,
          NOT: { role: "CREATOR" }
        },
      }),
      prisma.class.count({
        where: {
          ...branchFilter,
        },
      }),
      prisma.user.count({
        where: {
          role: { in: ["STUDENT", "TEACHER"], notIn: ["CREATOR"] },
          ...branchFilter,
          approved: false,
        },
      }),
    ]);

    // Get recent students (last 5)
    const recentStudents = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        ...branchFilter,
        NOT: { role: "CREATOR" }
      },
      select: {
        id: true,
        name: true,
        email: true,
        approved: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get recent classes (last 5)
    const recentClasses = await prisma.class.findMany({
      where: {
        ...branchFilter,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            classStudents: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      branchName,
      totalStudents,
      totalTeachers,
      activeClasses,
      pendingApprovals,
      recentStudents,
      recentClasses,
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Branch admin overview error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
