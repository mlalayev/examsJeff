import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireReferralManager,
  getScopedBranchId,
  assertSameBranchOrBoss,
} from "@/lib/auth-utils";
import { parseCommissionTiers, type CommissionTier } from "@/lib/referrals";
import { preparePasswordForStorage } from "@/lib/user-password";
import { z } from "zod";

const tierSchema = z.object({
  fromMonth: z.number().int().min(1),
  toMonth: z.number().int().min(1).nullable(),
  percent: z.number().min(0).max(100),
});

const decideSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("decline"),
    decisionNotes: z.string().optional().nullable(),
  }),
  z.object({
    action: z.literal("accept"),
    monthlyPrice: z.number().positive(),
    commissionTiers: z.array(tierSchema).min(1),
    decisionNotes: z.string().optional().nullable(),
    linkStudentId: z.string().min(1).optional(),
    createStudent: z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phoneNumber: z.string().optional(),
        program: z.string().optional(),
      })
      .optional(),
  }),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireReferralManager();
    const userId = (user as { id: string }).id;
    const { id } = await params;
    const body = await request.json();
    const data = decideSchema.parse(body);

    const referral = await prisma.referral.findUnique({
      where: { id },
      include: { branch: true },
    });

    if (!referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    assertSameBranchOrBoss(user, referral.branchId);

    if (referral.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Referral has already been decided" },
        { status: 400 }
      );
    }

    if (data.action === "decline") {
      const updated = await prisma.referral.update({
        where: { id },
        data: {
          status: "DECLINED",
          decidedById: userId,
          decidedAt: new Date(),
          decisionNotes: data.decisionNotes?.trim() || null,
        },
      });
      return NextResponse.json({ referral: updated });
    }

    const tiers: CommissionTier[] = parseCommissionTiers(data.commissionTiers);
    if (tiers.length === 0) {
      return NextResponse.json(
        { error: "At least one valid commission tier is required" },
        { status: 400 }
      );
    }

    let studentId = data.linkStudentId ?? null;

    if (data.createStudent) {
      const cs = data.createStudent;
      const existing = await prisma.user.findUnique({
        where: { email: cs.email.toLowerCase().trim() },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 400 }
        );
      }
      const { passwordHash, passwordEncrypted } = await preparePasswordForStorage(cs.password);
      const newStudent = await prisma.user.create({
        data: {
          firstName: cs.firstName.trim(),
          lastName: cs.lastName.trim(),
          email: cs.email.toLowerCase().trim(),
          passwordHash,
          passwordEncrypted,
          role: "STUDENT",
          approved: true,
          branchId: referral.branchId,
          studentProfile: {
            create: {
              branchId: referral.branchId,
              phoneNumber: cs.phoneNumber?.trim() || referral.studentPhone,
              program: cs.program?.trim() || referral.program,
            },
          },
        },
        select: { id: true },
      });
      studentId = newStudent.id;
    } else if (studentId) {
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, role: true, branchId: true },
      });
      if (!student || student.role !== "STUDENT") {
        return NextResponse.json({ error: "Invalid student account" }, { status: 400 });
      }
      if (student.branchId && student.branchId !== referral.branchId) {
        return NextResponse.json(
          { error: "Student belongs to a different branch" },
          { status: 400 }
        );
      }
      if (!student.branchId) {
        await prisma.user.update({
          where: { id: studentId },
          data: { branchId: referral.branchId },
        });
      }
    } else {
      return NextResponse.json(
        { error: "Link an existing student or create a new one" },
        { status: 400 }
      );
    }

    const now = new Date();
    const updated = await prisma.referral.update({
      where: { id },
      data: {
        status: "ACCEPTED",
        monthlyPrice: data.monthlyPrice,
        commissionTiers: tiers,
        studentId,
        decidedById: userId,
        decidedAt: now,
        acceptedAt: now,
        decisionNotes: data.decisionNotes?.trim() || null,
      },
      include: {
        branch: { select: { id: true, name: true } },
        partner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        student: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return NextResponse.json({ referral: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error instanceof Error) {
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes("Cross-branch")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    console.error("Referral decide:", error);
    return NextResponse.json({ error: "Failed to update referral" }, { status: 500 });
  }
}
