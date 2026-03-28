import OpenAI from "openai";
import { getOpenAI } from "./openai-client";

export interface IELTSTaskScore {
  taskResponse: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRangeAccuracy: number;
  overall: number;
  feedback: string;
  wordCount: number;
}

export interface IELTSWritingFullScore {
  task1: IELTSTaskScore;
  task2: IELTSTaskScore;
  overallBand: number;
}

/**
 * IELTS half-band rounding: 0, 0.5, 1, … 9 (nearest 0.5).
 * Weighted raw averages (e.g. 6.666…) become 6.5, not 6.7.
 */
export function roundToIeltsHalfBand(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const clamped = Math.max(0, Math.min(9, n));
  return Math.round(clamped * 2) / 2;
}

/** Per-task overall = mean of four criteria, each already half-band, then rounded. */
function finalizeTaskScores(
  raw: {
    taskResponse: number;
    coherenceCohesion: number;
    lexicalResource: number;
    grammaticalRangeAccuracy: number;
    feedback: string;
  },
  wordCount: number
): IELTSTaskScore {
  const tr = roundToIeltsHalfBand(Number(raw.taskResponse) || 0);
  const cc = roundToIeltsHalfBand(Number(raw.coherenceCohesion) || 0);
  const lr = roundToIeltsHalfBand(Number(raw.lexicalResource) || 0);
  const gra = roundToIeltsHalfBand(Number(raw.grammaticalRangeAccuracy) || 0);
  const overall = roundToIeltsHalfBand((tr + cc + lr + gra) / 4);
  return {
    taskResponse: tr,
    coherenceCohesion: cc,
    lexicalResource: lr,
    grammaticalRangeAccuracy: gra,
    overall,
    feedback: raw.feedback,
    wordCount,
  };
}

const STRICT_WRITING_RULES = `
========================
STRICT EXAMINER (CRITICAL)
========================
- Do NOT inflate scores. When in doubt, choose the LOWER half-band.
- Weak answers, vague ideas, or missing development: default band range 4.0–5.5 for affected criteria.
- Memorised / generic phrases without real development → Lexical Resource must not exceed 5.5.
- Many basic errors or only simple sentences → Grammatical Range & Accuracy capped at 5.5–6.0.
- Off-topic or severely under-length (beyond word-count penalty) → Task Response cannot be above 5.0.
- You are assessing for a real exam; be strict like an official IELTS examiner.

Scores must use 0.5 increments only (e.g. 6.0, 6.5, 7.0, never 6.7).
`;

export async function scoreIELTSWritingFull(data: {
  task1: { question: string; userAnswer: string; wordCount: number };
  task2: { question: string; userAnswer: string; wordCount: number };
}): Promise<IELTSWritingFullScore> {
  const systemPrompt = `You are a certified IELTS Writing examiner. Score BOTH Task 1 and Task 2 using official IELTS Writing Assessment Criteria.

${STRICT_WRITING_RULES}

📝 Criteria (each 0–9, half-band increments):

1️⃣ Task Response (TR) / Task Achievement (TA)
2️⃣ Coherence & Cohesion (CC)
3️⃣ Lexical Resource (LR)
4️⃣ Grammatical Range & Accuracy (GRA)

5️⃣ Word count expectations
→ Task 1: min 150 words (Actual: ${data.task1.wordCount})
→ Task 2: min 250 words (Actual: ${data.task2.wordCount})
❌ Short answers → lower Task Response (word count penalty applies in post-processing too)

6️⃣ Structure: clear paragraphs, logical progression (Task 1 & 2).

7️⃣ Idea development: explanations + examples where required; empty lists of ideas → cannot score above 6 for TR.

8️⃣ Relevance: off-topic content → strong Task Response penalty.

Feedback must be in Azerbaijani.

Your response MUST be valid JSON in this exact format (numbers are examples only):
{
  "task1": {
    "taskResponse": 6.5,
    "coherenceCohesion": 7.0,
    "lexicalResource": 6.0,
    "grammaticalRangeAccuracy": 6.5,
    "feedback": "Task 1 üçün ətraflı rəy Azərbaycan dilində"
  },
  "task2": {
    "taskResponse": 6.0,
    "coherenceCohesion": 6.5,
    "lexicalResource": 6.0,
    "grammaticalRangeAccuracy": 6.0,
    "feedback": "Task 2 üçün ətraflı rəy Azərbaycan dilində"
  }
}

Do NOT include "overall" per task or overallBand in JSON — the application computes them from the four criteria (IELTS-style mean → half-band) and Task 2 weighting.`;

  const userPrompt = `## Task 1 (Report/Graph Description)

**Question:**
${data.task1.question}

**Student Answer:**
${data.task1.userAnswer}

**Word Count:** ${data.task1.wordCount} words

---

## Task 2 (Essay)

**Question:**
${data.task2.question}

**Student Answer:**
${data.task2.userAnswer}

**Word Count:** ${data.task2.wordCount} words`;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 2500,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const scores = JSON.parse(content);

  // Apply word count penalties (raw, before half-band rounding)
  if (data.task1.wordCount < 150) {
    const penalty = Math.min(1.0, (150 - data.task1.wordCount) / 50);
    scores.task1.taskResponse = Math.max(0, scores.task1.taskResponse - penalty);
    scores.task1.feedback = `Söz sayı: ${data.task1.wordCount}/150 (cəza tətbiq edildi)\n\n${scores.task1.feedback}`;
  } else {
    scores.task1.feedback = `Söz sayı: ${data.task1.wordCount}/150\n\n${scores.task1.feedback}`;
  }

  if (data.task2.wordCount < 250) {
    const penalty = Math.min(1.0, (250 - data.task2.wordCount) / 50);
    scores.task2.taskResponse = Math.max(0, scores.task2.taskResponse - penalty);
    scores.task2.feedback = `Söz sayı: ${data.task2.wordCount}/250 (cəza tətbiq edildi)\n\n${scores.task2.feedback}`;
  } else {
    scores.task2.feedback = `Söz sayı: ${data.task2.wordCount}/250\n\n${scores.task2.feedback}`;
  }

  const task1 = finalizeTaskScores(scores.task1, data.task1.wordCount);
  const task2 = finalizeTaskScores(scores.task2, data.task2.wordCount);

  // Writing test: Task 2 counts double (standard IELTS-style weighting)
  const overallBand = roundToIeltsHalfBand((task1.overall + task2.overall * 2) / 3);

  return {
    task1,
    task2,
    overallBand,
  };
}

/**
 * Score a single task (used by `/api/ai-writing-score`).
 * Question text is optional; pass empty string to score answer only.
 */
export async function scoreIELTSWriting(
  response: string,
  taskType: "Task 1" | "Task 2",
  minWordCount: number
): Promise<IELTSTaskScore> {
  const wordCount = response.trim().split(/\s+/).filter(Boolean).length;

  const systemPrompt = `You are a strict IELTS Writing examiner. Score the following ${taskType} response using official IELTS criteria.

${STRICT_WRITING_RULES}

1️⃣ Task Response (TR) / Task Achievement (TA)
2️⃣ Coherence & Cohesion (CC)
3️⃣ Lexical Resource (LR)
4️⃣ Grammatical Range and Accuracy (GRA)

Minimum word count: ${minWordCount} words (Actual: ${wordCount} words)

Provide scores 0–9 in 0.5 increments for each criterion. Feedback in Azerbaijani.

Your response MUST be valid JSON in this exact format:
{
  "taskResponse": 6.5,
  "coherenceCohesion": 7.0,
  "lexicalResource": 6.0,
  "grammaticalRangeAccuracy": 6.5,
  "feedback": "Detailed feedback in Azerbaijani"
}

Do NOT include "overall" — it will be computed as the mean of the four criteria, rounded to the nearest half-band.`;

  const userPrompt = `${taskType} Response:\n\n${response}`;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 1500,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const parsed = JSON.parse(content);

  if (wordCount < minWordCount) {
    const penalty = Math.min(1.0, (minWordCount - wordCount) / 50);
    parsed.taskResponse = Math.max(0, parsed.taskResponse - penalty);
    parsed.feedback = `Word count: ${wordCount}/${minWordCount} (penalty applied)\n\n${parsed.feedback}`;
  } else {
    parsed.feedback = `Word count: ${wordCount}/${minWordCount}\n\n${parsed.feedback}`;
  }

  return finalizeTaskScores(parsed, wordCount);
}
