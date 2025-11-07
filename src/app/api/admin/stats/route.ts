import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await requireAdmin();

    // Get total students
    const totalStudents = await prisma.user.count({
      where: { role: "STUDENT" }
    });

    // Get pending approvals (students not approved)
    const pendingApprovals = await prisma.user.count({
      where: {
        role: "STUDENT",
        approved: false
      }
    });

    // Get total exams
    const totalExams = await prisma.exam.count();

    // Get active exams
    const activeExams = await prisma.exam.count({
      where: { isActive: true }
    });

    // Get total attempts
    const totalAttempts = await prisma.attempt.count();

    // Get recent attempts (last 24 hours)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    const recentAttempts = await prisma.attempt.count({
      where: {
        createdAt: {
          gte: yesterday
        }
      }
    });

    return NextResponse.json({
      totalStudents,
      pendingApprovals,
      totalExams,
      activeExams,
      totalAttempts,
      recentAttempts
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

