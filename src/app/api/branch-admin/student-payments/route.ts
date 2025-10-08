import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBranchAdmin, getScopedBranchId } from "@/lib/auth-utils";

// GET /api/branch-admin/student-payments?studentId=xxx - Get payments for a specific student
export async function GET(request: Request) {
  try {
    const user = await requireBranchAdmin();
    const branchId = getScopedBranchId(user);
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    
    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const branchFilter = branchId ? { branchId } : {};

    const payments = await prisma.paymentSchedule.findMany({
      where: {
        studentId: studentId,
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
    console.error("Student payments error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
