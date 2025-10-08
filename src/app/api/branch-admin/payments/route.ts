import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBranchAdmin, getScopedBranchId } from "@/lib/auth-utils";
import { z } from "zod";

const updatePaymentSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  status: z.enum(["PAID", "CANCELLED"]),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

const createPaymentSchema = z.object({
  enrollmentId: z.string().min(1, "Enrollment ID is required"),
  amount: z.number().positive("Amount must be positive"),
  dueDate: z.string().datetime(), // ISO 8601 UTC
  notes: z.string().optional(),
});

// GET /api/branch-admin/payments - List payments
export async function GET(request: Request) {
  try {
    const user = await requireBranchAdmin();
    const branchId = getScopedBranchId(user);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const studentId = searchParams.get("studentId");
    
    const branchFilter = branchId ? { branchId } : {};
    const whereClause: any = {
      ...branchFilter,
    };

    if (status) {
      whereClause.status = status;
    }

    if (studentId) {
      whereClause.studentId = studentId;
    }

    const payments = await prisma.paymentSchedule.findMany({
      where: whereClause,
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
            id: true,
            courseName: true,
            courseType: true,
            level: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ payments });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Branch admin payments error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

// POST /api/branch-admin/payments - Create new payment schedule
export async function POST(request: Request) {
  try {
    const user = await requireBranchAdmin();
    const branchId = getScopedBranchId(user);
    const body = await request.json();
    const validatedData = createPaymentSchema.parse(body);

    // Verify enrollment exists and belongs to the branch
    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        id: validatedData.enrollmentId,
        ...(branchId && { branchId }),
      },
      select: { id: true, studentId: true },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    const payment = await prisma.paymentSchedule.create({
      data: {
        enrollmentId: validatedData.enrollmentId,
        studentId: enrollment.studentId,
        amount: validatedData.amount,
        dueDate: new Date(validatedData.dueDate),
        notes: validatedData.notes,
        branchId: branchId,
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
            id: true,
            courseName: true,
            courseType: true,
            level: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      message: "Payment schedule created successfully", 
      payment 
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Create payment error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

// PATCH /api/branch-admin/payments - Update payment status
export async function PATCH(request: Request) {
  try {
    const user = await requireBranchAdmin();
    const branchId = getScopedBranchId(user);
    const body = await request.json();
    const validatedData = updatePaymentSchema.parse(body);

    // Verify payment exists and belongs to the branch
    const payment = await prisma.paymentSchedule.findFirst({
      where: {
        id: validatedData.paymentId,
        ...(branchId && { branchId }),
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const updateData: any = {
      status: validatedData.status,
    };

    if (validatedData.status === "PAID") {
      updateData.paidDate = new Date();
      updateData.paymentMethod = validatedData.paymentMethod;
    }

    if (validatedData.notes) {
      updateData.notes = validatedData.notes;
    }

    const updatedPayment = await prisma.paymentSchedule.update({
      where: { id: validatedData.paymentId },
      data: updateData,
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
            id: true,
            courseName: true,
            courseType: true,
            level: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      message: "Payment updated successfully", 
      payment: updatedPayment 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Update payment error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
