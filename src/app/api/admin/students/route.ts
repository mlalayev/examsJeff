import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { studentListWhereForBucket } from "@/lib/study-types";

export async function GET(request: Request) {
  try {
    const user = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const approved = searchParams.get("approved");
    const bucket = searchParams.get("bucket");

    const where: {
      role: "STUDENT";
      approved?: boolean;
      AND?: Record<string, unknown>[];
    } = {
      role: "STUDENT",
    };

    if (approved !== null) {
      where.approved = approved === "true";
    }

    const bucketWhere = bucket ? studentListWhereForBucket(bucket) : null;
    if (bucketWhere) {
      where.AND = [bucketWhere];
    }

    const rows = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        approved: true,
        branchId: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        studentProfile: {
          select: {
            phoneNumber: true,
            dateOfBirth: true,
            program: true,
            monthlyFee: true,
            paymentAmount: true,
            paymentDate: true,
            lessonsStopped: true,
            lessonsStoppedAt: true,
            studyTypes: true,
            lessonModes: true,
            studentKind: true,
            studyStatus: true,
            coinBalance: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5000,
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const studentIds = rows.map((u) => u.id);
    const currentPayments =
      studentIds.length > 0
        ? await prisma.tuitionPayment.findMany({
            where: { studentId: { in: studentIds }, year, month },
            select: { studentId: true, status: true, amount: true, paidAt: true },
          })
        : [];
    const paymentByStudent = new Map(
      currentPayments.map((p) => [p.studentId, p])
    );

    const students = rows.map((u) => {
      const sp = u.studentProfile;
      const pay = paymentByStudent.get(u.id);
      return {
        id: u.id,
        name: [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || null,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        approved: u.approved,
        branchId: u.branchId,
        createdAt: u.createdAt,
        branch: u.branch,
        phoneNumber: sp?.phoneNumber ?? null,
        dateOfBirth: sp?.dateOfBirth ?? null,
        program: sp?.program ?? null,
        studyTypes: sp?.studyTypes ?? [],
        lessonModes: sp?.lessonModes ?? [],
        monthlyFee: sp?.monthlyFee != null ? Number(sp.monthlyFee) : null,
        lessonsStopped: sp?.lessonsStopped ?? false,
        lessonsStoppedAt: sp?.lessonsStoppedAt ?? null,
        studentKind: sp?.studentKind ?? "STUDENT",
        studyStatus: sp?.studyStatus ?? "CONTINUES",
        coinBalance: sp?.coinBalance ?? 0,
        currentMonth: {
          year,
          month,
          status: pay?.status ?? "NO_RECORD",
          amount: pay ? Number(pay.amount) : null,
          paidAt: pay?.paidAt ?? null,
        },
      };
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

