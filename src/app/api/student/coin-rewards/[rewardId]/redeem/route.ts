import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import {
  CoinError,
  getStudentCoinHistory,
  redeemCoinReward,
  serializeCoinHistoryRow,
} from "@/lib/coins";

// POST /api/student/coin-rewards/[rewardId]/redeem
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ rewardId: string }> }
) {
  try {
    const user = await requireStudent();
    const studentId = (user as any).id as string;
    const { rewardId } = await params;

    const result = await redeemCoinReward(studentId, rewardId);
    const history = await getStudentCoinHistory(studentId, 1);

    return NextResponse.json({
      success: true,
      balance: result.balance,
      transaction: history[0] ? serializeCoinHistoryRow(history[0]) : null,
    });
  } catch (error) {
    if (error instanceof CoinError) {
      const status =
        error.code === "INSUFFICIENT_BALANCE"
          ? 400
          : error.code === "REWARD_NOT_FOUND" || error.code === "REWARD_INACTIVE"
            ? 404
            : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    return handleApiError(error, "Redeem coin reward");
  }
}
