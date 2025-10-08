import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBranchAdmin, getScopedBranchId } from "@/lib/auth-utils";

// GET /api/branch/students?search=&from=&to=&overdue=true - Get students with profiles (branch-scoped)
export async function GET(request: Request) {
  try {
    const user = await requireBranchAdmin();
    const branchId = getScopedBranchId(user);
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const overdue = searchParams.get("overdue") === "true";
    const overdueYear = parseInt(searchParams.get("overdueYear") || new Date().getFullYear().toString());
    const overdueMonth = parseInt(searchParams.get("overdueMonth") || (new Date().getMonth() + 1).toString());

    // Build where clause
    const whereClause: any = {
      role: "STUDENT",
    };

    // Branch scoping
    if (branchId) {
      whereClause.branchId = branchId;
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Date range filter
    if (from || to) {
      whereClause.createdAt = {};
      if (from) whereClause.createdAt.gte = new Date(from);
      if (to) whereClause.createdAt.lte = new Date(to);
    }

    let students = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        approved: true,
        branchId: true,
        createdAt: true,
        studentProfile: {
          select: {
            id: true,
            firstEnrollAt: true,
            monthlyFee: true,
            teacherId: true,
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter by overdue payments if requested
    if (overdue) {
      const studentIds = students.map(s => s.id);
      
      // Get unpaid payments for the specified year/month
      const unpaidPayments = await prisma.tuitionPayment.findMany({
        where: {
          studentId: { in: studentIds },
          year: overdueYear,
          month: overdueMonth,
          status: "UNPAID",
        },
        select: { studentId: true },
      });

      const unpaidStudentIds = new Set(unpaidPayments.map(p => p.studentId));

      // Also include students without any payment record for that month (also overdue)
      const studentsWithPaymentRecord = await prisma.tuitionPayment.findMany({
        where: {
          studentId: { in: studentIds },
          year: overdueYear,
          month: overdueMonth,
        },
        select: { studentId: true },
      });

      const studentsWithRecord = new Set(studentsWithPaymentRecord.map(p => p.studentId));

      // Filter: students with UNPAID record OR no record at all
      students = students.filter(s => 
        unpaidStudentIds.has(s.id) || !studentsWithRecord.has(s.id)
      );
    }

    return NextResponse.json({ students });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Branch students error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
