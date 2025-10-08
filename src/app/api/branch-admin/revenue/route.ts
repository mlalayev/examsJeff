import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBranchAdmin, getScopedBranchId } from "@/lib/auth-utils";

// GET /api/branch-admin/revenue?year=2024&month=1 - Get revenue analytics
export async function GET(request: Request) {
  try {
    const user = await requireBranchAdmin();
    const branchId = getScopedBranchId(user);
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
    
    const branchFilter = branchId ? { branchId } : {};

    // Get all payments for the specified month/year
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const payments = await prisma.paymentSchedule.findMany({
      where: {
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
        ...branchFilter,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        enrollment: {
          select: {
            courseName: true,
            courseType: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    // Calculate revenue metrics
    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const paidRevenue = payments
      .filter(payment => payment.status === 'PAID')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    const pendingRevenue = payments
      .filter(payment => payment.status === 'PENDING')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    const overdueRevenue = payments
      .filter(payment => payment.status === 'OVERDUE')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    // Group by course type
    const revenueByCourse = payments.reduce((acc, payment) => {
      const courseType = payment.enrollment.courseType;
      if (!acc[courseType]) {
        acc[courseType] = { total: 0, paid: 0, pending: 0, overdue: 0 };
      }
      acc[courseType].total += Number(payment.amount);
      if (payment.status === 'PAID') acc[courseType].paid += Number(payment.amount);
      else if (payment.status === 'PENDING') acc[courseType].pending += Number(payment.amount);
      else if (payment.status === 'OVERDUE') acc[courseType].overdue += Number(payment.amount);
      return acc;
    }, {} as Record<string, { total: number; paid: number; pending: number; overdue: number }>);

    // Group by student
    const revenueByStudent = payments.reduce((acc, payment) => {
      const studentId = payment.student.id;
      if (!acc[studentId]) {
        acc[studentId] = {
          student: payment.student,
          total: 0,
          paid: 0,
          pending: 0,
          overdue: 0,
        };
      }
      acc[studentId].total += Number(payment.amount);
      if (payment.status === 'PAID') acc[studentId].paid += Number(payment.amount);
      else if (payment.status === 'PENDING') acc[studentId].pending += Number(payment.amount);
      else if (payment.status === 'OVERDUE') acc[studentId].overdue += Number(payment.amount);
      return acc;
    }, {} as Record<string, { student: any; total: number; paid: number; pending: number; overdue: number }>);

    // Get branch name if applicable
    let branchName = null;
    if (branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { name: true },
      });
      branchName = branch?.name;
    }

    return NextResponse.json({
      period: { year, month },
      branch: branchName,
      summary: {
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        overdueRevenue,
        totalPayments: payments.length,
        paidPayments: payments.filter(p => p.status === 'PAID').length,
        pendingPayments: payments.filter(p => p.status === 'PENDING').length,
        overduePayments: payments.filter(p => p.status === 'OVERDUE').length,
      },
      revenueByCourse,
      revenueByStudent: Object.values(revenueByStudent),
      payments,
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Revenue analytics error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
