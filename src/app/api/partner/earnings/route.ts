import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePartner } from "@/lib/auth-utils";
import {
  parseCommissionTiers,
  monthIndexSinceAcceptance,
  percentForMonth,
  decimalToNumber,
  formatStudentName,
} from "@/lib/referrals";

export async function GET() {
  try {
    const user = await requirePartner();
    const partnerId = (user as { id: string }).id;

    const referrals = await prisma.referral.findMany({
      where: { partnerId, status: "ACCEPTED", studentId: { not: null } },
      include: {
        branch: { select: { id: true, name: true } },
        student: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    const studentIds = referrals
      .map((r) => r.studentId)
      .filter((id): id is string => !!id);

    const payments =
      studentIds.length > 0
        ? await prisma.tuitionPayment.findMany({
            where: { studentId: { in: studentIds }, status: "PAID" },
            orderBy: [{ year: "asc" }, { month: "asc" }],
          })
        : [];

    const paymentsByStudent = new Map<string, typeof payments>();
    for (const p of payments) {
      const list = paymentsByStudent.get(p.studentId) ?? [];
      list.push(p);
      paymentsByStudent.set(p.studentId, list);
    }

    let totalEarned = 0;
    const breakdown: {
      referralId: string;
      studentName: string;
      branchName: string;
      lines: {
        year: number;
        month: number;
        tuitionPaid: number;
        monthIndex: number;
        percent: number;
        commission: number;
      }[];
      subtotal: number;
    }[] = [];

    for (const ref of referrals) {
      if (!ref.studentId || !ref.acceptedAt) continue;
      const tiers = parseCommissionTiers(ref.commissionTiers);
      const studentPayments = paymentsByStudent.get(ref.studentId) ?? [];
      const lines: (typeof breakdown)[0]["lines"] = [];
      let subtotal = 0;

      for (const pay of studentPayments) {
        const monthIndex = monthIndexSinceAcceptance(
          ref.acceptedAt,
          pay.year,
          pay.month
        );
        if (monthIndex < 1) continue;
        const percent = percentForMonth(tiers, monthIndex);
        const tuitionPaid = decimalToNumber(pay.amount);
        const commission = (tuitionPaid * percent) / 100;
        lines.push({
          year: pay.year,
          month: pay.month,
          tuitionPaid,
          monthIndex,
          percent,
          commission,
        });
        subtotal += commission;
      }

      totalEarned += subtotal;
      breakdown.push({
        referralId: ref.id,
        studentName: ref.student
          ? formatStudentName(
              ref.student.firstName ?? "",
              ref.student.lastName
            ) || ref.student.email
          : formatStudentName(ref.studentFirstName, ref.studentLastName),
        branchName: ref.branch.name,
        lines,
        subtotal,
      });
    }

    const summary = {
      inProgress: await prisma.referral.count({
        where: { partnerId, status: "IN_PROGRESS" },
      }),
      accepted: await prisma.referral.count({
        where: { partnerId, status: "ACCEPTED" },
      }),
      declined: await prisma.referral.count({
        where: { partnerId, status: "DECLINED" },
      }),
    };

    return NextResponse.json({
      summary,
      totalEarned,
      currency: "AZN",
      breakdown,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Partner earnings GET:", error);
    return NextResponse.json({ error: "Failed to fetch earnings" }, { status: 500 });
  }
}
