import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePartner } from "@/lib/auth-utils";
import {
  parseCommissionTiers,
  monthIndexSinceAcceptance,
  percentForMonth,
  decimalToNumber,
  formatStudentName,
  roundMoney,
} from "@/lib/referrals";

type PaymentLine = {
  year: number;
  month: number;
  tuitionPaid: number;
  monthIndex: number;
  percent: number;
  commission: number;
  source: "tuition" | "schedule";
};

function paymentAmount(
  paid: number,
  monthlyPrice: number | null
): number {
  if (paid > 0) return paid;
  if (monthlyPrice != null && monthlyPrice > 0) return monthlyPrice;
  return 0;
}

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

    const [tuitionPayments, schedulePayments] =
      studentIds.length > 0
        ? await Promise.all([
            prisma.tuitionPayment.findMany({
              where: { studentId: { in: studentIds }, status: "PAID" },
              orderBy: [{ year: "asc" }, { month: "asc" }],
            }),
            prisma.paymentSchedule.findMany({
              where: {
                studentId: { in: studentIds },
                status: "PAID",
                paidDate: { not: null },
              },
              orderBy: { paidDate: "asc" },
            }),
          ])
        : [[], []];

    const tuitionByStudent = new Map<string, typeof tuitionPayments>();
    for (const p of tuitionPayments) {
      const list = tuitionByStudent.get(p.studentId) ?? [];
      list.push(p);
      tuitionByStudent.set(p.studentId, list);
    }

    const scheduleByStudent = new Map<string, typeof schedulePayments>();
    for (const p of schedulePayments) {
      const list = scheduleByStudent.get(p.studentId) ?? [];
      list.push(p);
      scheduleByStudent.set(p.studentId, list);
    }

    let totalEarned = 0;
    const breakdown: {
      referralId: string;
      studentName: string;
      branchName: string;
      agreedMonthlyPrice: number | null;
      lines: PaymentLine[];
      subtotal: number;
    }[] = [];

    for (const ref of referrals) {
      if (!ref.studentId || !ref.acceptedAt) continue;

      const tiers = parseCommissionTiers(ref.commissionTiers);
      const monthlyPrice =
        ref.monthlyPrice != null ? decimalToNumber(ref.monthlyPrice) : null;
      const linesByPeriod = new Map<string, PaymentLine>();

      const addLine = (line: PaymentLine) => {
        const key = `${line.year}-${line.month}`;
        const existing = linesByPeriod.get(key);
        if (!existing || line.tuitionPaid > existing.tuitionPaid) {
          linesByPeriod.set(key, line);
        }
      };

      for (const pay of tuitionByStudent.get(ref.studentId) ?? []) {
        const monthIndex = monthIndexSinceAcceptance(
          ref.acceptedAt,
          pay.year,
          pay.month
        );
        if (monthIndex < 1) continue;
        const percent = percentForMonth(tiers, monthIndex);
        const rawPaid = decimalToNumber(pay.amount);
        const tuitionPaid = paymentAmount(rawPaid, monthlyPrice);
        const commission = roundMoney((tuitionPaid * percent) / 100);
        addLine({
          year: pay.year,
          month: pay.month,
          tuitionPaid: roundMoney(tuitionPaid),
          monthIndex,
          percent,
          commission,
          source: "tuition",
        });
      }

      for (const pay of scheduleByStudent.get(ref.studentId) ?? []) {
        if (!pay.paidDate) continue;
        const year = pay.paidDate.getUTCFullYear();
        const month = pay.paidDate.getUTCMonth() + 1;
        const monthIndex = monthIndexSinceAcceptance(ref.acceptedAt, year, month);
        if (monthIndex < 1) continue;
        const percent = percentForMonth(tiers, monthIndex);
        const rawPaid = decimalToNumber(pay.amount);
        const tuitionPaid = paymentAmount(rawPaid, monthlyPrice);
        const commission = roundMoney((tuitionPaid * percent) / 100);
        addLine({
          year,
          month,
          tuitionPaid: roundMoney(tuitionPaid),
          monthIndex,
          percent,
          commission,
          source: "schedule",
        });
      }

      const lines = Array.from(linesByPeriod.values()).sort(
        (a, b) => a.year - b.year || a.month - b.month
      );

      const subtotal = roundMoney(
        lines.reduce((sum, l) => sum + l.commission, 0)
      );
      totalEarned = roundMoney(totalEarned + subtotal);

      breakdown.push({
        referralId: ref.id,
        studentName: ref.student
          ? formatStudentName(
              ref.student.firstName ?? "",
              ref.student.lastName
            ) || ref.student.email
          : formatStudentName(ref.studentFirstName, ref.studentLastName),
        branchName: ref.branch.name,
        agreedMonthlyPrice: monthlyPrice,
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
