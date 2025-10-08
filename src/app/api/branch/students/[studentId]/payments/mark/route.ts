import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBranchAdmin, getScopedBranchId } from "@/lib/auth-utils";
import { z } from "zod";

const markPaymentSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  paid: z.boolean(),
  amount: z.number().optional(),
  note: z.string().optional(),
});

// POST /api/branch/students/:studentId/payments/mark - Mark payment as paid/unpaid
export async function POST(
  request: Request,
  { params }: { params: { studentId: string } }
) {
  try {
    const user = await requireBranchAdmin();
    const branchId = getScopedBranchId(user);
    const { studentId } = params;

    const body = await request.json();
    const validatedData = markPaymentSchema.parse(body);

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

    // Enforce branch scoping (only for BRANCH_ADMIN, BOSS can update any)
    if (branchId && student.branchId !== branchId) {
      return NextResponse.json({ error: "Student is not in your branch" }, { status: 403 });
    }

    if (!student.branchId) {
      return NextResponse.json({ error: "Student must be assigned to a branch first" }, { status: 400 });
    }

    // Determine amount (use provided amount, or default to monthlyFee, or 0)
    const paymentAmount = validatedData.amount ?? student.studentProfile?.monthlyFee ?? 0;

    // Upsert payment record
    const payment = await prisma.tuitionPayment.upsert({
      where: {
        studentId_year_month: {
          studentId: studentId,
          year: validatedData.year,
          month: validatedData.month,
        },
      },
      create: {
        studentId: studentId,
        branchId: student.branchId,
        year: validatedData.year,
        month: validatedData.month,
        amount: paymentAmount,
        status: validatedData.paid ? "PAID" : "UNPAID",
        paidAt: validatedData.paid ? new Date() : null,
        note: validatedData.note,
      },
      update: {
        amount: paymentAmount,
        status: validatedData.paid ? "PAID" : "UNPAID",
        paidAt: validatedData.paid 
          ? (validatedData.paid && !student ? new Date() : undefined) // Only set if changing to paid
          : null, // Clear if marking unpaid
        note: validatedData.note,
      },
    });

    return NextResponse.json({ 
      message: `Payment marked as ${validatedData.paid ? "PAID" : "UNPAID"}`, 
      payment 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: error.errors 
      }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Mark payment error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
