import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import { listActiveCoinRewards } from "@/lib/coins";

// GET /api/student/coin-rewards — available rewards catalog
export async function GET() {
  try {
    await requireStudent();
    const rewards = await listActiveCoinRewards();
    return NextResponse.json({ rewards });
  } catch (error) {
    return handleApiError(error, "List coin rewards");
  }
}
