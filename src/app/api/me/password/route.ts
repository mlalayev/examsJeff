import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { updateUserPassword, verifyUserPassword } from "@/lib/user-password";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

// PATCH /api/me/password — change own password (vault updated for creator recovery)
export async function PATCH(request: Request) {
  try {
    const user = await requireAuth();
    const userId = (user as { id: string }).id;
    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const account = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!account) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valid = await verifyUserPassword(account.passwordHash, currentPassword);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 }
      );
    }

    await updateUserPassword(prisma, userId, newPassword);

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
