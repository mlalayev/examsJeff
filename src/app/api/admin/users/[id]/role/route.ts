import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { z } from "zod";

const roleSchema = z.object({
  role: z.enum(["STUDENT", "TEACHER", "ADMIN", "BOSS", "BRANCH_ADMIN"])
});

// PATCH /api/admin/users/[id]/role
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const current = await requireAdmin();
    const body = await request.json();
    
    const { role } = roleSchema.parse(body);
    // Prevent non-BOSS from assigning BOSS
    const currentRole = (current as any).role as string;
    if (role === "BOSS" && currentRole !== "BOSS") {
      return NextResponse.json({ error: "Only BOSS can assign BOSS" }, { status: 403 });
    }
    
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });
    
    return NextResponse.json({ user, message: "Role updated successfully" });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

