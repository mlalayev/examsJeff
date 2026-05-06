import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// DELETE /api/admin/users/:id - Delete a user (CREATOR/ADMIN/BOSS)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const current = await requireAuth();
    const currentRole = (current as any).role as string;

    if (currentRole !== "CREATOR" && currentRole !== "ADMIN" && currentRole !== "BOSS") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, email: true },
    });

    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Prevent anyone except CREATOR from deleting CREATOR accounts
    if (target.role === "CREATOR" && currentRole !== "CREATOR") {
      return NextResponse.json({ error: "Cannot delete creator account" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    // Prisma FK constraint errors will surface here
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}

