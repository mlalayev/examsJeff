import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePartner } from "@/lib/auth-utils";
import { formatStudentName } from "@/lib/referrals";
import { z } from "zod";

const createReferralSchema = z.object({
  branchId: z.string().min(1),
  studentFirstName: z.string().min(1),
  studentLastName: z.string().optional().nullable(),
  studentEmail: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v?.trim() ? v.trim() : null))
    .refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Invalid email address",
    }),
  studentPhone: z.string().optional().nullable(),
  program: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

function serializeReferral(r: {
  id: string;
  studentFirstName: string;
  studentLastName: string | null;
  studentEmail: string | null;
  studentPhone: string | null;
  program: string | null;
  notes: string | null;
  status: string;
  monthlyPrice: unknown;
  commissionTiers: unknown;
  acceptedAt: Date | null;
  decidedAt: Date | null;
  decisionNotes: string | null;
  createdAt: Date;
  branch: { id: string; name: string };
}) {
  return {
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
  };
}

export async function GET() {
  try {
    const user = await requirePartner();
    const partnerId = (user as { id: string }).id;

    const referrals = await prisma.referral.findMany({
      where: { partnerId },
      include: { branch: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      referrals: referrals.map(serializeReferral),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Partner referrals GET:", error);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePartner();
    const partnerId = (user as { id: string }).id;
    const body = await request.json();
    const data = createReferralSchema.parse(body);

    const branch = await prisma.branch.findUnique({
      where: { id: data.branchId },
      select: { id: true },
    });
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 400 });
    }

    const referral = await prisma.referral.create({
      data: {
        partnerId,
        branchId: data.branchId,
        studentFirstName: data.studentFirstName.trim(),
        studentLastName: data.studentLastName?.trim() || null,
        studentEmail: data.studentEmail?.trim() || null,
        studentPhone: data.studentPhone?.trim() || null,
        program: data.program?.trim() || null,
        notes: data.notes?.trim() || null,
      },
      include: { branch: { select: { id: true, name: true } } },
    });

    return NextResponse.json(
      { referral: serializeReferral(referral) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Partner referrals POST:", error);
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }
}
