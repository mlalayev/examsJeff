import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBranchAdmin, getScopedBranchId } from "@/lib/auth-utils";

// GET /api/branch/students/:studentId/payments?year=YYYY - Get student's tuition payments for a year
export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const user = await requireBranchAdmin();
    const branchId = getScopedBranchId(user);
    const { studentId } = await params;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    // Verify student exists and is in the same branch
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { 
        id: true, 
        role: true, 
        branchId: true,
        studentProfile: {
          select: {
            monthlyFee: true,
          },
        },
      },
    });

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Enforce branch scoping (only for BRANCH_ADMIN, BOSS can view any)
    if (branchId && student.branchId !== branchId) {
      return NextResponse.json({ error: "Student is not in your branch" }, { status: 403 });
    }

    // Get all payments for the year
    const payments = await prisma.tuitionPayment.findMany({
      where: {
        studentId: studentId,
        year: year,
      },
      orderBy: { month: "asc" },
    });

    // Create a map for quick lookup
    const paymentMap = new Map(payments.map(p => [p.month, p]));

    // Build array for all 12 months
    const monthlyPayments = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const existing = paymentMap.get(month);
      
      if (existing) {
        return {
          month,
          id: existing.id,
          amount: Number(existing.amount),
          status: existing.status,
          paidAt: existing.paidAt,
          note: existing.note,
          exists: true,
        };
      } else {
        // Virtual unpaid record
        return {
          month,
          id: null,
          amount: Number(student.studentProfile?.monthlyFee || 0),
          status: "UNPAID",
          paidAt: null,
          note: null,
          exists: false,
        };
      }
    });

    return NextResponse.json({ 
      year,
      defaultFee: Number(student.studentProfile?.monthlyFee || 0),
      payments: monthlyPayments 
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Student payments error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
