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
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const user = await requireBranchAdmin();
    const branchId = getScopedBranchId(user);
    const { studentId } = await params;

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

    const fallbackFee = Number(student.studentProfile?.monthlyFee ?? 0);
    const paymentAmount =
      validatedData.amount != null && Number.isFinite(validatedData.amount)
        ? Number(validatedData.amount)
        : fallbackFee;

    if (validatedData.paid && (!Number.isFinite(paymentAmount) || paymentAmount <= 0)) {
      return NextResponse.json(
        { error: "Set a payment amount before marking as paid" },
        { status: 400 }
      );
    }

    // Look up existing record to know whether we should bump paidAt now
    const existing = await prisma.tuitionPayment.findUnique({
      where: {
        studentId_year_month: {
          studentId,
          year: validatedData.year,
          month: validatedData.month,
        },
      },
      select: { status: true, paidAt: true },
    });

    const becomesPaid = validatedData.paid && existing?.status !== "PAID";

    const payment = await prisma.tuitionPayment.upsert({
      where: {
        studentId_year_month: {
          studentId,
          year: validatedData.year,
          month: validatedData.month,
        },
      },
      create: {
        studentId,
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
          ? becomesPaid
            ? new Date()
            : existing?.paidAt ?? new Date()
          : null,
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
