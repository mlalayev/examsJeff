import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/analytics/boss/finance-enhanced - Enhanced finance analytics with filters
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const role = (user as any).role;
    
    if (role !== "BOSS") {
      return NextResponse.json({ error: "Forbidden: Boss access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;
    const branchId = searchParams.get("branchId") || null;

    // Get all branches
    const branches = await prisma.branch.findMany({
      select: { id: true, name: true },
    });

    // Course types we track
    const courseTypes = ["IELTS", "SAT", "KIDS", "GENERAL_ENGLISH"];

    // Build date filter
    let dateFilter: any = {};
    if (month) {
      // Specific month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      dateFilter = {
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
      };
    } else {
      // Whole year
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      dateFilter = {
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    // Add branch filter if specified
    const branchFilter = branchId ? { branchId } : {};

    // Get finance transactions
    const transactions = await prisma.financeTxn.findMany({
      where: {
        ...dateFilter,
        ...branchFilter,
      },
      include: {
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    // Calculate totals
    const totalIncome = transactions
      .filter(t => t.kind === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpense = transactions
      .filter(t => t.kind === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Get student enrollment stats by course type
    const enrollmentStats = await Promise.all(
      courseTypes.map(async (courseType) => {
        const enrollmentFilter: any = {
          courseType,
          status: "ACTIVE",
        };
        
        if (branchId) {
          enrollmentFilter.branchId = branchId;
        }

        const count = await prisma.studentEnrollment.count({
          where: enrollmentFilter,
        });

        // Calculate revenue from this course type (from payment schedules)
        const revenue = await prisma.paymentSchedule.aggregate({
          where: {
            enrollment: {
              courseType,
              status: "ACTIVE",
              ...(branchId ? { branchId } : {}),
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
          ...branchFilter,
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
          ...(branchId ? { branchId } : {}),
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

    // Get branch breakdown
    const branchData = await Promise.all(
      branches.map(async (branch) => {
        const branchTxns = transactions.filter(t => t.branchId === branch.id);
        
        const income = branchTxns
          .filter(t => t.kind === "INCOME")
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const expense = branchTxns
          .filter(t => t.kind === "EXPENSE")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const students = await prisma.user.count({
          where: {
            branchId: branch.id,
            role: "STUDENT",
          },
        });

        const tuitionRevenue = await prisma.tuitionPayment.aggregate({
          where: {
            branchId: branch.id,
            status: "PAID",
            year,
            ...(month ? { month } : {}),
          },
          _sum: { amount: true },
        });

        return {
          branchId: branch.id,
          branchName: branch.name,
          income,
          expense,
          net: income - expense,
          studentCount: students,
          tuitionRevenue: Number(tuitionRevenue._sum.amount || 0),
        };
      })
    );

    // Get tuition payment stats
    const tuitionStats = await prisma.tuitionPayment.aggregate({
      where: {
        status: "PAID",
        year,
        ...(month ? { month } : {}),
        ...branchFilter,
      },
      _sum: { amount: true },
      _count: true,
    });

    const unpaidCount = await prisma.tuitionPayment.count({
      where: {
        status: "UNPAID",
        year,
        ...(month ? { month } : {}),
        ...branchFilter,
      },
    });

    return NextResponse.json({
      period: {
        year,
        month: month || "all",
        branchId: branchId || "all",
      },
      summary: {
        totalIncome,
        totalExpense,
        totalNet: totalIncome - totalExpense,
        tuitionRevenue: Number(tuitionStats._sum.amount || 0),
        tuitionPaymentCount: tuitionStats._count,
        tuitionUnpaidCount: unpaidCount,
      },
      courseTypeStats: enrollmentStats,
      monthlyBreakdown: monthlyData,
      branchBreakdown: branchData,
      branches, // For filter dropdown
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Enhanced finance analytics error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

