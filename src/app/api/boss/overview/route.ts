import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBoss } from "@/lib/auth-utils";

// GET /api/boss/overview - global KPIs
export async function GET() {
  try {
    await requireBoss();

    const [branches, users, classes, bookings, attempts, students, paidPayments, unpaidPayments] = await Promise.all([
      prisma.branch.count(),
      prisma.user.count({ where: { NOT: { role: "CREATOR" } } }),
      prisma.class.count(),
      prisma.booking.count(),
      prisma.attempt.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.tuitionPayment.count({ where: { status: "PAID" } }),
      prisma.tuitionPayment.count({ where: { status: "UNPAID" } }),
    ]);

    const recentBookings = await prisma.booking.findMany({
      orderBy: { startAt: "desc" },
      take: 10,
      include: {
        student: { select: { id: true, name: true, email: true } },
        exam: { select: { id: true, title: true } },
        teacher: { select: { id: true, name: true } },
      },
    });

    const recentUsers = await prisma.user.findMany({
      where: {
        // Hide CREATOR accounts from everyone
        role: { not: "CREATOR" }
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, email: true, role: true, createdAt: true, branchId: true },
    });

    // Get recent payments (last 10)
    const recentPayments = await prisma.tuitionPayment.findMany({
      orderBy: { paidAt: "desc" },
      take: 10,
      where: { status: "PAID" },
      include: {
        student: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    // Calculate this month's payment stats
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const thisMonthPaid = await prisma.tuitionPayment.count({
      where: {
        year: currentYear,
        month: currentMonth,
        status: "PAID",
      },
    });

    const thisMonthTotal = await prisma.studentProfile.count({
      where: {
        student: { role: "STUDENT" },
      },
    });

    return NextResponse.json({
      kpis: { 
        branches, 
        users, 
        classes, 
        bookings, 
        attempts, 
        students,
        paidPayments,
        unpaidPayments,
        thisMonthPaid,
        thisMonthTotal,
      },
      recentBookings,
      recentUsers,
      recentPayments,
    });
  } catch (e) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}


