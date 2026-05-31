import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireReferralManager,
  getScopedBranchId,
} from "@/lib/auth-utils";
import { formatStudentName } from "@/lib/referrals";

export async function GET(request: Request) {
  try {
    const user = await requireReferralManager();
    const branchId = getScopedBranchId(user);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: {
      branchId?: string;
      status?: "IN_PROGRESS" | "ACCEPTED" | "DECLINED";
    } = {};

    if (branchId) where.branchId = branchId;
    if (
      status === "IN_PROGRESS" ||
      status === "ACCEPTED" ||
      status === "DECLINED"
    ) {
      where.status = status;
    }

    const referrals = await prisma.referral.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        partner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        decidedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      referrals: referrals.map((r) => ({
        id: r.id,
        studentName: formatStudentName(r.studentFirstName, r.studentLastName),
        studentFirstName: r.studentFirstName,
        studentLastName: r.studentLastName,
        studentEmail: r.studentEmail,
        studentPhone: r.studentPhone,
        program: r.program,
        notes: r.notes,
        status: r.status,
        monthlyPrice: r.monthlyPrice != null ? Number(r.monthlyPrice) : null,
        commissionTiers: r.commissionTiers,
        acceptedAt: r.acceptedAt,
        decidedAt: r.decidedAt,
        decisionNotes: r.decisionNotes,
        createdAt: r.createdAt,
        branch: r.branch,
        partner: r.partner,
        student: r.student,
        decidedBy: r.decidedBy,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Referrals GET:", error);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}
