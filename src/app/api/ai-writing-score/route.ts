import { NextRequest, NextResponse } from "next/server";
import { scoreIELTSWriting } from "@/lib/ielts-writing-ai-score";

export async function POST(request: NextRequest) {
  try {
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

    if (task1Response && taskType !== "task2Only") {
      task1Score = await scoreIELTSWriting(task1Response, "Task 1", 150);
    }

    if (task2Response && taskType !== "task1Only") {
      task2Score = await scoreIELTSWriting(task2Response, "Task 2", 250);
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
