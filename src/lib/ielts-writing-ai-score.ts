import OpenAI from "openai";

let openaiSingleton: OpenAI | null = null;

/** Lazy init so `next build` does not require OPENAI_API_KEY at module load time */
function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  if (!openaiSingleton) {
    openaiSingleton = new OpenAI({ apiKey });
  }
  return openaiSingleton;
}

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

export async function scoreIELTSWritingFull(data: {
  task1: { question: string; userAnswer: string; wordCount: number };
  task2: { question: string; userAnswer: string; wordCount: number };
}): Promise<IELTSWritingFullScore> {
  const systemPrompt = `You are an IELTS Writing examiner. Score BOTH Task 1 and Task 2 according to the IELTS Writing Assessment Criteria.

📝 IELTS Writing Scoring Criteria:

1️⃣ Task Response (TR) / Task Achievement (TA)
→ Suala cavab verib-vermir? mövzudan çıxmısan?
→ Has the candidate addressed all parts of the task?

2️⃣ Coherence & Cohesion (CC)
→ Yazı axıcıdır? paragraph + linking words var?
→ Is the writing well-organized with clear paragraphs and linking words?

3️⃣ Lexical Resource (LR)
→ Vocabulary necədir? synonyms istifadə etmisən?
→ Range and accuracy of vocabulary, use of synonyms

4️⃣ Grammatical Range & Accuracy (GRA)
→ Qrammatika düzgündür? complex cümlə var?
→ Variety of sentence structures and grammatical accuracy

5️⃣ Word Count
→ Task 1: min 150 words (Actual: ${data.task1.wordCount})
→ Task 2: min 250 words (Actual: ${data.task2.wordCount})
❌ az yazsan band düşür (word count penalty applies)

6️⃣ Task Structure
→ Intro + Body + Conclusion olmalıdır
❌ structure yoxdursa CC düşür

7️⃣ Idea Development
→ sadəcə fikir yox, izah + example olmalıdır
❌ boş fikir → band 6-dan yuxarı çıxmır

8️⃣ Relevance
→ hər cümlə mövzu ilə bağlı olmalıdır
❌ off-topic → Task Response düşür

Provide scores on a scale of 0-9 (with 0.5 increments) for EACH criterion for BOTH tasks.
Feedback should be in Azerbaijani language.

Your response MUST be valid JSON in this exact format:
{
  "task1": {
    "taskResponse": 6.5,
    "coherenceCohesion": 7.0,
    "lexicalResource": 6.0,
    "grammaticalRangeAccuracy": 6.5,
    "overall": 6.5,
    "feedback": "Task 1 üçün ətraflı rəy Azərbaycan dilində (güclu və zəif tərəflər)"
  },
  "task2": {
    "taskResponse": 6.0,
    "coherenceCohesion": 6.5,
    "lexicalResource": 6.0,
    "grammaticalRangeAccuracy": 6.0,
    "overall": 6.0,
    "feedback": "Task 2 üçün ətraflı rəy Azərbaycan dilində (güclu və zəif tərəflər)"
  },
  "overallBand": 6.5
}`;

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
    temperature: 0.3,
    max_tokens: 2500,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const scores = JSON.parse(content);

  // Apply word count penalties if needed
  if (data.task1.wordCount < 150) {
    const penalty = Math.min(1.0, (150 - data.task1.wordCount) / 50);
    scores.task1.taskResponse = Math.max(0, scores.task1.taskResponse - penalty);
    scores.task1.overall = Math.max(0, scores.task1.overall - penalty * 0.5);
    scores.task1.feedback = `⚠️ Söz sayı: ${data.task1.wordCount}/150 (cəza tətbiq edildi)\n\n${scores.task1.feedback}`;
  } else {
    scores.task1.feedback = `✅ Söz sayı: ${data.task1.wordCount}/150\n\n${scores.task1.feedback}`;
  }

  if (data.task2.wordCount < 250) {
    const penalty = Math.min(1.0, (250 - data.task2.wordCount) / 50);
    scores.task2.taskResponse = Math.max(0, scores.task2.taskResponse - penalty);
    scores.task2.overall = Math.max(0, scores.task2.overall - penalty * 0.5);
    scores.task2.feedback = `⚠️ Söz sayı: ${data.task2.wordCount}/250 (cəza tətbiq edildi)\n\n${scores.task2.feedback}`;
  } else {
    scores.task2.feedback = `✅ Söz sayı: ${data.task2.wordCount}/250\n\n${scores.task2.feedback}`;
  }

  scores.task1.wordCount = data.task1.wordCount;
  scores.task2.wordCount = data.task2.wordCount;

  // Calculate overall band (Task 2 weighted more)
  scores.overallBand = (scores.task1.overall + scores.task2.overall * 2) / 3;

  return {
    task1: scores.task1,
    task2: scores.task2,
    overallBand: scores.overallBand,
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

  const systemPrompt = `You are an IELTS Writing examiner. Score the following ${taskType} response according to the IELTS Writing Assessment Criteria.

IELTS Writing Criteria:

1️⃣ Task Response (TR) / Task Achievement (TA)
2️⃣ Coherence & Cohesion (CC)
3️⃣ Lexical Resource (LR)
4️⃣ Grammatical Range and Accuracy (GRA)

Minimum word count: ${minWordCount} words (Actual: ${wordCount} words)

Provide scores on a scale of 0-9 (with 0.5 increments) for each criterion.
Also provide overall band score and detailed feedback in Azerbaijani language.

Your response MUST be valid JSON in this exact format:
{
  "taskResponse": 6.5,
  "coherenceCohesion": 7.0,
  "lexicalResource": 6.0,
  "grammaticalRangeAccuracy": 6.5,
  "overall": 6.5,
  "feedback": "Detailed feedback in Azerbaijani"
}`;

  const userPrompt = `${taskType} Response:\n\n${response}`;

  const completion = await getOpenAI().chat.completions.create({
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

  const parsed = JSON.parse(content);

  if (wordCount < minWordCount) {
    const penalty = Math.min(1.0, (minWordCount - wordCount) / 50);
    parsed.taskResponse = Math.max(0, parsed.taskResponse - penalty);
    parsed.overall = Math.max(0, parsed.overall - penalty * 0.5);
    parsed.feedback = `⚠️ Word count: ${wordCount}/${minWordCount} (penalty applied)\n\n${parsed.feedback}`;
  } else {
    parsed.feedback = `✅ Word count: ${wordCount}/${minWordCount}\n\n${parsed.feedback}`;
  }

  return {
    taskResponse: parsed.taskResponse,
    coherenceCohesion: parsed.coherenceCohesion,
    lexicalResource: parsed.lexicalResource,
    grammaticalRangeAccuracy: parsed.grammaticalRangeAccuracy,
    overall: parsed.overall,
    feedback: parsed.feedback,
    wordCount,
  };
}
