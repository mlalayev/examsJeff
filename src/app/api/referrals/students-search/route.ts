import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireReferralManager,
  getScopedBranchId,
} from "@/lib/auth-utils";

/** Search students to link when accepting a referral */
export async function GET(request: Request) {
  try {
    const user = await requireReferralManager();
    const branchId = getScopedBranchId(user);
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const branchFilter = searchParams.get("branchId");

    if (q.length < 2) {
      return NextResponse.json({ students: [] });
    }

    const where: Record<string, unknown> = {
      role: "STUDENT",
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    };

    const effectiveBranch = branchId ?? branchFilter ?? undefined;
    if (effectiveBranch) where.branchId = effectiveBranch;

    const students = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        branchId: true,
        branch: { select: { name: true } },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ students });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
