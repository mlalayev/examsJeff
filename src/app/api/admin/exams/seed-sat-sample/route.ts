import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireBranchAdminOrBoss } from "@/lib/auth-utils";
import { seedSatDigitalSample } from "@/lib/seed-sat-digital-sample";

/**
 * POST /api/admin/exams/seed-sat-sample
 * Creates the fixed SAT Digital sample exam if missing (idempotent).
 *
 * Query:
 *   ?replace=1 — only if the sample exists and has zero bookings: delete and recreate.
 *
 * Auth: ADMIN, or BRANCH_ADMIN / BRANCH_BOSS (same pattern as other admin exam routes).
 */
export async function POST(request: NextRequest) {
  try {
    try {
      await requireAdmin();
    } catch {
      await requireBranchAdminOrBoss();
    }

    const replace =
      request.nextUrl.searchParams.get("replace") === "1" ||
      request.nextUrl.searchParams.get("replace") === "true";

    const result = await seedSatDigitalSample(prisma, {
      replaceIfSafe: replace,
    });

    return NextResponse.json({
      examId: result.examId,
      action: result.action,
      message: result.message,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.toLowerCase().includes("forbidden") || msg.toLowerCase().includes("unauthorized")) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    console.error("seed-sat-sample:", e);
    return NextResponse.json(
      { error: "Failed to create SAT sample exam", details: msg },
      { status: 500 }
    );
  }
}
