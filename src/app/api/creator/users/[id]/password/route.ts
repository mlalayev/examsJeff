import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";
import { z } from "zod";

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// PATCH /api/creator/users/:id/password - Reset user password (CREATOR only)
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
    const { newPassword } = passwordSchema.parse(body);

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    return NextResponse.json({ 
      message: "Password reset successfully",
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}


