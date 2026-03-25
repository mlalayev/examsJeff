import { NextRequest, NextResponse } from "next/server";
import { scoreIELTSWriting } from "@/lib/ielts-writing-ai-score";
import { requireAuth } from "@/lib/auth-utils";
import { checkRateLimit } from "@/lib/rate-limiter";
import { handleOpenAIError } from "@/lib/openai-client";
import { RATE_LIMITS, ROUTE_CONFIG } from "@/lib/rate-limit-config";

// Configure route for longer execution time
export const maxDuration = ROUTE_CONFIG.maxDuration;

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Rate limiting: 10 AI scoring requests per minute per user
    const limit = RATE_LIMITS.GENERIC_AI_SCORE;
    const rateLimitCheck = checkRateLimit(`ai-writing:${user.id}`, limit.maxRequests, limit.windowMs);
    if (rateLimitCheck.limited) {
      return NextResponse.json(
        {
          error: "Too many AI scoring requests",
          hint: `Please wait ${rateLimitCheck.resetIn} seconds before trying again.`,
          remaining: rateLimitCheck.remaining,
          resetIn: rateLimitCheck.resetIn,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.maxRequests.toString(),
            "X-RateLimit-Remaining": rateLimitCheck.remaining.toString(),
            "X-RateLimit-Reset": rateLimitCheck.resetIn.toString(),
          },
        }
      );
    }

    if (!process.env.OPENAI_API_KEY?.trim()) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY is not configured on this server",
          hint: "Set OPENAI_API_KEY in the server environment and restart Next.js.",
        },
        { status: 503 }
      );
    }

    const { task1Response, task2Response, taskType } = await request.json();

    if (!task1Response && !task2Response) {
      return NextResponse.json(
        { error: "At least one task response is required" },
        { status: 400 }
      );
    }

    let task1Score = null;
    let task2Score = null;

    try {
      if (task1Response && taskType !== "task2Only") {
        task1Score = await scoreIELTSWriting(task1Response, "Task 1", 150);
      }

      if (task2Response && taskType !== "task1Only") {
        task2Score = await scoreIELTSWriting(task2Response, "Task 2", 250);
      }
    } catch (aiError: any) {
      handleOpenAIError(aiError);
    }

    return NextResponse.json({
      task1: task1Score,
      task2: task2Score,
    });
  } catch (error: any) {
    console.error("Error scoring writing:", error);
    return NextResponse.json(
      {
        error: "Failed to score writing",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
