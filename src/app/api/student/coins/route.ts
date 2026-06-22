import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import {
  getStudentCoinBalance,
  getStudentCoinHistory,
  serializeCoinHistoryRow,
} from "@/lib/coins";

// GET /api/student/coins — own balance and transaction history
export async function GET() {
  try {
    const user = await requireStudent();
    const studentId = (user as any).id as string;

    const [balance, history] = await Promise.all([
      getStudentCoinBalance(studentId),
      getStudentCoinHistory(studentId),
    ]);

    return NextResponse.json({
      balance,
      transactions: history.map(serializeCoinHistoryRow),
    });
  } catch (error) {
    return handleApiError(error, "Get student coins");
  }
}
