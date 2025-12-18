import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { z } from "zod";

const schema = z.object({
  approved: z.boolean(),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN", "BOSS", "BRANCH_ADMIN", "BRANCH_BOSS", "CREATOR", "PARENT"]).optional(),
  branchId: z.string().nullable().optional(),
});

// PATCH /api/admin/users/:id/approve
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const current = await requireAuth();
    const currentRole = (current as any).role as string;
    const currentBranchId = (current as any).branchId as string | null | undefined;

    // CREATOR has full access
    if (currentRole !== "CREATOR" && currentRole !== "BOSS" && currentRole !== "ADMIN" && currentRole !== "BRANCH_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { approved, role, branchId } = schema.parse(body);

    // Nobody can assign or modify CREATOR role except CREATOR itself
    if (role === "CREATOR" && currentRole !== "CREATOR") {
      return NextResponse.json({ error: "Cannot assign CREATOR role" }, { status: 403 });
    }

    // Branch admin can only approve within their branch and cannot assign BOSS role
    if (currentRole === "BRANCH_ADMIN") {
      if (role === "BOSS") {
        return NextResponse.json({ error: "Branch admin cannot assign BOSS" }, { status: 403 });
      }
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, branchId: true, role: true } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Prevent anyone except CREATOR from modifying CREATOR accounts
    if (target.role === "CREATOR" && currentRole !== "CREATOR") {
      return NextResponse.json({ error: "Cannot modify creator account" }, { status: 403 });
    }

    if (currentRole === "BRANCH_ADMIN") {
      const effectiveBranchId = branchId ?? target.branchId;
      if (!currentBranchId || !effectiveBranchId || currentBranchId !== effectiveBranchId) {
        return NextResponse.json({ error: "Forbidden: cross-branch" }, { status: 403 });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        approved,
        ...(role ? { role } : {}),
        // BOSS/ADMIN may change branchId; BRANCH_ADMIN may only keep within own branch (checked above)
        ...(branchId !== undefined ? { branchId } : {}),
      },
      select: { id: true, approved: true, role: true, branchId: true }
    });

    return NextResponse.json({ user: updated, message: "Approval updated" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}


