import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// DELETE /api/admin/finance/clear - Clear demo finance transactions
export async function DELETE() {
  try {
    const user = await requireAuth();
    const role = (user as any).role;
    
    if (role !== "BOSS" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin or Boss access required" }, { status: 403 });
    }

    // Delete only transactions that have meta.seeded = true
    const result = await prisma.financeTxn.deleteMany({
      where: {
        meta: {
          path: ["seeded"],
          equals: true,
        },
      },
    });

    return NextResponse.json({
      message: "Demo finance transactions cleared successfully",
      deletedCount: result.count,
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Finance clear error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
