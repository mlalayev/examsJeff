import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCoinManager } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import {
  addManualCoins,
  assertCanManageStudentCoins,
  CoinError,
  getStudentCoinBalance,
  getStudentCoinHistory,
  serializeCoinHistoryRow,
} from "@/lib/coins";

const manualAddSchema = z.object({
  amount: z
    .number()
    .int("Amount must be a whole number")
    .positive("Amount must be positive"),
  reason: z
    .string()
    .trim()
    .min(3, "Reason must be at least 3 characters")
    .max(500, "Reason is too long"),
});

// GET /api/students/[studentId]/coins — balance (+ optional history for staff)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const actor = await requireCoinManager();
    const { studentId } = await params;
    const { searchParams } = new URL(request.url);
    const includeHistory =
      searchParams.get("history") === "1" ||
      searchParams.get("history") === "true";

    await assertCanManageStudentCoins(
      { id: (actor as any).id, role: (actor as any).role },
      studentId
    );

    const balance = await getStudentCoinBalance(studentId);
    const transactions = includeHistory
      ? (await getStudentCoinHistory(studentId)).map(serializeCoinHistoryRow)
      : undefined;

    return NextResponse.json({ studentId, balance, transactions });
  } catch (error) {
    if (error instanceof Error && error.message === "Student not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return handleApiError(error, "Get student coin balance");
  }
}

// POST /api/students/[studentId]/coins — manual coin add (staff only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const actor = await requireCoinManager();
    const { studentId } = await params;
    const actorId = (actor as any).id as string;
    const actorRole = (actor as any).role as string;

    await assertCanManageStudentCoins({ id: actorId, role: actorRole }, studentId);

    const body = await request.json();
    const { amount, reason } = manualAddSchema.parse(body);

    const result = await addManualCoins({
      studentId,
      amount,
      reason,
      createdById: actorId,
    });

    return NextResponse.json({
      success: true,
      balance: result.balance,
      transaction: {
        id: result.transaction.id,
        amount: result.transaction.amount,
        type: result.transaction.type,
        source: result.transaction.source,
        reason: result.transaction.reason,
        createdAt: result.transaction.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof CoinError) {
      const status =
        error.code === "NOT_STUDENT" || error.code === "NO_PROFILE" ? 400 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    if (error instanceof Error && error.message === "Student not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return handleApiError(error, "Manual add coins");
  }
}
