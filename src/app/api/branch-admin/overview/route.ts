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

    const now = new Date();

    // Get total counts for the branch
    const [totalStudents, totalTeachers, activeClasses, pendingApprovals] = await Promise.all([
      prisma.user.count({
        where: {
          role: "STUDENT",
          branchId: branchId,
        },
      }),
      prisma.user.count({
        where: {
          role: "TEACHER",
          branchId: branchId,
        },
      }),
      prisma.class.count({
        where: {
          branchId: branchId,
        },
      }),
      prisma.user.count({
        where: {
          role: { in: ["STUDENT", "TEACHER"] },
          branchId: branchId,
          approved: false,
        },
      }),
    ]);

    // Get recent students (last 5)
    const recentStudents = await prisma.user.findMany({
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
      take: 5,
    });

    // Get recent classes (last 5)
    const recentClasses = await prisma.class.findMany({
      where: {
        branchId: branchId,
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
