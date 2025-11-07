import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBoss } from "@/lib/auth-utils";
import { z } from "zod";

const schema = z.object({ branchId: z.string().min(1) });

// PATCH /api/admin/users/:id/assign-branch-admin (BOSS-only)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireBoss();
    const { id } = await params;
    const body = await request.json();
    const { branchId } = schema.parse(body);

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

    const user = await prisma.user.update({
      where: { id },
      data: { role: "BRANCH_ADMIN", branchId },
      select: { id: true, name: true, email: true, role: true, branchId: true }
    });

    return NextResponse.json({ user, message: "User promoted to Branch Admin" });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Validation error" }, { status: 400 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}


