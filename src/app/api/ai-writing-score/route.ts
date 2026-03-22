import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface IELTSScoring {
  taskResponse: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRangeAccuracy: number;
  overall: number;
  feedback: string;
  wordCount: number;
}

export async function POST(request: NextRequest) {
  try {
    const { task1Response, task2Response, taskType } = await request.json();

    if (!task1Response && !task2Response) {
      return NextResponse.json(
        { error: "At least one task response is required" },
        { status: 400 }
      );
    }

    let task1Score: IELTSScoring | null = null;
    let task2Score: IELTSScoring | null = null;

    // Score Task 1 if provided
    if (task1Response && taskType !== "task2Only") {
      task1Score = await scoreIELTSWriting(task1Response, "Task 1", 150);
    }

    // Score Task 2 if provided
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

async function scoreIELTSWriting(
  response: string,
  taskType: "Task 1" | "Task 2",
  minWordCount: number
): Promise<IELTSScoring> {
  const wordCount = response.trim().split(/\s+/).length;

  const systemPrompt = `You are an IELTS Writing examiner. Score the following ${taskType} response according to the IELTS Writing Assessment Criteria.

IELTS Writing Criteria:

1️⃣ Task Response (TR) / Task Achievement (TA)
→ Has the candidate addressed all parts of the task?
→ Are ideas relevant and well-developed?
→ Minimum word count: ${minWordCount} words (Actual: ${wordCount} words)

2️⃣ Coherence & Cohesion (CC)
→ Is the writing well-organized with clear paragraphs?
→ Are linking words used effectively?
→ Does the writing flow logically?

3️⃣ Lexical Resource (LR)
→ Range and accuracy of vocabulary
→ Use of synonyms and paraphrasing
→ Appropriateness of word choice

4️⃣ Grammatical Range and Accuracy (GRA)
→ Variety of sentence structures
→ Grammatical accuracy
→ Use of complex sentences

Provide scores on a scale of 0-9 (with 0.5 increments) for each criterion.
Also provide overall band score and detailed feedback in Azerbaijani language.

Your response MUST be valid JSON in this exact format:
{
  "taskResponse": 6.5,
  "coherenceCohesion": 7.0,
  "lexicalResource": 6.0,
  "grammaticalRangeAccuracy": 6.5,
  "overall": 6.5,
  "feedback": "Detailed feedback in Azerbaijani explaining strengths and areas for improvement"
}`;

  const userPrompt = `${taskType} Response:\n\n${response}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const scores = JSON.parse(content);

    // Apply word count penalty if under minimum
    if (wordCount < minWordCount) {
      const penalty = Math.min(1.0, (minWordCount - wordCount) / 50);
      scores.taskResponse = Math.max(0, scores.taskResponse - penalty);
      scores.overall = Math.max(0, scores.overall - penalty * 0.5);
      
      scores.feedback = `⚠️ Word count: ${wordCount}/${minWordCount} (penalty applied)\n\n${scores.feedback}`;
    } else {
      scores.feedback = `✅ Word count: ${wordCount}/${minWordCount}\n\n${scores.feedback}`;
    }

    return {
      taskResponse: scores.taskResponse,
      coherenceCohesion: scores.coherenceCohesion,
      lexicalResource: scores.lexicalResource,
      grammaticalRangeAccuracy: scores.grammaticalRangeAccuracy,
      overall: scores.overall,
      feedback: scores.feedback,
      wordCount,
    };
  } catch (error: any) {
    console.error("Error calling OpenAI:", error);
    throw new Error(`Failed to score writing: ${error.message}`);
  }
}
