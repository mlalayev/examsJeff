import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBranchAdmin, getScopedBranchId } from "@/lib/auth-utils";

// GET /api/analytics/branch/finance - Branch admin finance analytics
export async function GET(request: Request) {
  try {
    const user = await requireBranchAdmin();
    const branchId = getScopedBranchId(user);

    if (!branchId) {
      return NextResponse.json({ error: "Branch ID required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;

    // Get branch info
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true },
    });

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Course types
    const courseTypes = ["IELTS", "SAT", "KIDS", "GENERAL_ENGLISH"];

    // Build date filter
    let dateFilter: any = {};
    if (month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      dateFilter = {
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
      };
    } else {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      dateFilter = {
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    // Get finance transactions for this branch
    const transactions = await prisma.financeTxn.findMany({
      where: {
        ...dateFilter,
        branchId,
      },
    });

    // Calculate totals
    const totalIncome = transactions
      .filter(t => t.kind === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpense = transactions
      .filter(t => t.kind === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Get student enrollment stats by course type for this branch
    const enrollmentStats = await Promise.all(
      courseTypes.map(async (courseType) => {
        const count = await prisma.studentEnrollment.count({
          where: {
            courseType,
            status: "ACTIVE",
            branchId,
          },
        });

        // Calculate revenue from this course type
        const revenue = await prisma.paymentSchedule.aggregate({
          where: {
            enrollment: {
              courseType,
              status: "ACTIVE",
              branchId,
            },
            status: "PAID",
            dueDate: {
              gte: month 
                ? new Date(year, month - 1, 1)
                : new Date(year, 0, 1),
              lte: month
                ? new Date(year, month, 0, 23, 59, 59)
                : new Date(year, 11, 31, 23, 59, 59),
            },
          },
          _sum: {
            amount: true,
          },
        });

        return {
          courseType,
          studentCount: count,
          revenue: Number(revenue._sum.amount || 0),
        };
      })
    );

    // Get monthly breakdown for the year
    const monthlyData = [];
    for (let m = 1; m <= 12; m++) {
      const monthStart = new Date(year, m - 1, 1);
      const monthEnd = new Date(year, m, 0, 23, 59, 59);

      const monthTxns = await prisma.financeTxn.findMany({
        where: {
          occurredAt: { gte: monthStart, lte: monthEnd },
          branchId,
        },
      });

      const income = monthTxns
        .filter(t => t.kind === "INCOME")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const expense = monthTxns
        .filter(t => t.kind === "EXPENSE")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const tuitionPaid = await prisma.tuitionPayment.aggregate({
        where: {
          year,
          month: m,
          status: "PAID",
          branchId,
        },
        _sum: { amount: true },
      });

      monthlyData.push({
        month: m,
        monthName: new Date(year, m - 1).toLocaleString('en-US', { month: 'short' }),
        income,
        expense,
        net: income - expense,
        tuitionRevenue: Number(tuitionPaid._sum.amount || 0),
      });
    }

    // Get tuition payment stats
    const tuitionStats = await prisma.tuitionPayment.aggregate({
      where: {
        status: "PAID",
        year,
        ...(month ? { month } : {}),
        branchId,
      },
      _sum: { amount: true },
      _count: true,
    });

    const unpaidCount = await prisma.tuitionPayment.count({
      where: {
        status: "UNPAID",
        year,
        ...(month ? { month } : {}),
        branchId,
      },
    });

    // Get current month statistics
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const currentMonthPaidCount = await prisma.tuitionPayment.count({
      where: {
        year: currentYear,
        month: currentMonth,
        status: "PAID",
        branchId,
      },
    });

    const currentMonthUnpaidCount = await prisma.tuitionPayment.count({
      where: {
        year: currentYear,
        month: currentMonth,
        status: "UNPAID",
        branchId,
      },
    });

    // Get total active students count for this branch
    const totalStudentsCount = await prisma.user.count({
      where: {
        role: "STUDENT",
        branchId,
      },
    });

    // Get teacher count
    const teacherCount = await prisma.user.count({
      where: {
        role: "TEACHER",
        branchId,
      },
    });

    const studentsWithPaymentRecord = currentMonthPaidCount + currentMonthUnpaidCount;
    const studentsWithoutRecord = totalStudentsCount - studentsWithPaymentRecord;

    return NextResponse.json({
      branch,
      period: {
        year,
        month: month || "all",
      },
      summary: {
        totalIncome,
        totalExpense,
        totalNet: totalIncome - totalExpense,
        tuitionRevenue: Number(tuitionStats._sum.amount || 0),
        tuitionPaymentCount: tuitionStats._count,
        tuitionUnpaidCount: unpaidCount,
      },
      currentMonth: {
        year: currentYear,
        month: currentMonth,
        paidCount: currentMonthPaidCount,
        unpaidCount: currentMonthUnpaidCount,
        noRecordCount: studentsWithoutRecord,
        totalStudents: totalStudentsCount,
        paymentRate: totalStudentsCount > 0 
          ? ((currentMonthPaidCount / totalStudentsCount) * 100).toFixed(1)
          : "0.0",
      },
      courseTypeStats: enrollmentStats,
      monthlyBreakdown: monthlyData,
      stats: {
        studentCount: totalStudentsCount,
        teacherCount,
      },
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Branch finance analytics error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
