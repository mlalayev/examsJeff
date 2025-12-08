import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { z } from "zod";

const schema = z.object({
  approved: z.boolean(),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN", "BOSS", "BRANCH_ADMIN", "BRANCH_BOSS", "CREATOR"]).optional(),
  branchId: z.string().nullable().optional(),
});

// PATCH /api/creator/users/:id/approve - Approve/disapprove and update user (CREATOR only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const role = (user as any).role;

    // Only CREATOR can access this endpoint
    if (role !== "CREATOR") {
      return NextResponse.json({ error: "Forbidden: CREATOR access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { approved, role: newRole, branchId } = schema.parse(body);

    const target = await prisma.user.findUnique({ 
      where: { id }, 
      select: { id: true, role: true } 
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        approved,
        ...(newRole ? { role: newRole } : {}),
        ...(branchId !== undefined ? { branchId } : {}),
      },
      select: { 
        id: true, 
        approved: true, 
        role: true, 
        branchId: true,
        name: true,
        email: true
      }
    });

    return NextResponse.json({ 
      user: updated, 
      message: approved ? "User approved" : "User disapproved" 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

