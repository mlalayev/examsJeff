import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { z } from "zod";
import { updateUserPassword } from "@/lib/user-password";
import { decryptPassword } from "@/lib/password-vault";

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

function requireCreator(role: string) {
  if (role !== "CREATOR") {
    return NextResponse.json({ error: "Forbidden: CREATOR access required" }, { status: 403 });
  }
  return null;
}

// GET /api/creator/users/:id/password - View vaulted password (CREATOR only)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const forbidden = requireCreator((user as any).role);
    if (forbidden) return forbidden;

    const { id } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordEncrypted: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!targetUser.passwordEncrypted) {
      return NextResponse.json({
        available: false,
        message:
          "Password not stored in vault. Reset the password to save it for future recovery.",
      });
    }

    const password = decryptPassword(targetUser.passwordEncrypted);
    if (!password) {
      return NextResponse.json({
        available: false,
        message: "Stored password could not be decrypted. Reset the password.",
      });
    }

    return NextResponse.json({
      available: true,
      password,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: [targetUser.firstName, targetUser.lastName].filter(Boolean).join(" ") || null,
      },
    });
  } catch (error) {
    console.error("View password error:", error);
    return NextResponse.json({ error: "Failed to retrieve password" }, { status: 500 });
  }
}

// PATCH /api/creator/users/:id/password - Reset user password (CREATOR only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const forbidden = requireCreator((user as any).role);
    if (forbidden) return forbidden;

    const { id } = await params;
    const body = await request.json();
    const { newPassword } = passwordSchema.parse(body);

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await updateUserPassword(prisma, id, newPassword);

    return NextResponse.json({
      message: "Password reset successfully",
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: [targetUser.firstName, targetUser.lastName].filter(Boolean).join(" ") || null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}

