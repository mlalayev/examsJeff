import { getOpenAI } from "./openai-client";

export interface SpeakingQuestionTurn {
  questionId: string;
  prompt: string;
  transcript: string;
}

export interface IELTSSpeakingExamPayload {
  part1: SpeakingQuestionTurn[];
  part2: SpeakingQuestionTurn[];
  part3: SpeakingQuestionTurn[];
}

export interface IELTSSpeakingPartBand {
  band: number;
  feedback: string;
}

export interface IELTSSpeakingScoreResult {
  fluencyCoherence: number;
  lexicalResource: number;
  grammar: number;
  pronunciation: number;
  overallBand: number;
  part1: IELTSSpeakingPartBand;
  part2: IELTSSpeakingPartBand;
  part3: IELTSSpeakingPartBand;
  overallFeedback: string;
}

function clampBand(n: number): number {
  const x = Number(n);
  if (Number.isNaN(x)) return 0;
  const rounded = Math.round(x * 2) / 2;
  return Math.min(9, Math.max(0, rounded));
}

function averageBand(
  fc: number,
  lr: number,
  gra: number,
  pron: number,
): number {
  return clampBand((fc + lr + gra + pron) / 4);
}

/** Part listed in exam but every question has an empty transcript */
function isPartCompletelyUnanswered(turns: SpeakingQuestionTurn[]): boolean {
  if (turns.length === 0) return false;
  return !turns.some((t) => t.transcript.trim().length > 0);
}

const UNANSWERED_PART_BAND = 2.0;
const UNANSWERED_PART_FEEDBACK_AZ =
  "Bu hissədə cavab vermədiyiniz üçün ciddi cəza alırsınız. Bu, ümumi balınızı aşağı salır.";

/** Overall speaking band = mean of part bands (only parts that have ≥1 question in the exam). */
function overallBandFromPartBands(
  partBands: number[],
): number {
  if (partBands.length === 0) return 0;
  return clampBand(partBands.reduce((a, b) => a + b, 0) / partBands.length);
}

/**
 * Single OpenAI call: full speaking test as one JSON (parts 1–3 with prompts + transcripts).
 * Overall band (after scoring): mean of part bands for parts that exist in the exam — (part1+part2+part3)/n.
 * FC/LR/GRA/PRON are returned for detail only; they do not define the overall band.
 */
export async function scoreIELTSSpeakingFromPayload(
  payload: IELTSSpeakingExamPayload,
): Promise<IELTSSpeakingScoreResult> {
  const systemPrompt = `
  You are a certified IELTS Speaking examiner with strict scoring standards.
  
  You receive ONE JSON object containing:
  - part1: array of { prompt, transcript }
  - part2: array of { prompt, transcript }
  - part3: array of { prompt, transcript }
  
  Your task is to evaluate the candidate STRICTLY using official IELTS criteria.
  
  ========================
  SCORING CRITERIA (0–9, half-band allowed)
  ========================
  
  1. Fluency & Coherence (FC)
  - Natural flow of speech
  - Logical development of ideas
  - Hesitation, repetition, abrupt endings LOWER the score
  
  2. Lexical Resource (LR)
  - Vocabulary range and flexibility
  - Paraphrasing ability
  - Repetition of simple words = LOW score
  - Informal/slang = penalize
  
  3. Grammatical Range & Accuracy (GRA)
  - Variety of sentence structures
  - Accuracy of grammar
  - Only simple sentences = LIMITED RANGE
  
  4. Pronunciation (PRON)
  - Clarity and intelligibility
  - Natural rhythm and stress
  - Assume transcript reflects basic pronunciation issues
  
  ========================
  STRICT PENALTIES
  ========================
  
  - Missing answers in Part 2 or Part 3 → STRONG penalty
  - Very short answers (< 30 words) → LOW band
  - No examples or explanations → max band 6.0
  - Repetitive vocabulary → max band 5.5
  - Only basic grammar → max band 5.5
  - Empty Part 2 or Part 3 → overall band MUST NOT exceed 5.0
  
  ========================
  IMPORTANT RULES
  ========================
  
  - DO NOT be generous
  - DO NOT inflate scores
  - Default range for weak answers: 4.0–5.5
  - Use full band scale honestly
  
  ========================
  OUTPUT RULES
  ========================
  
  Return ONLY valid JSON.
  
  All feedback MUST be in Azerbaijani language.
  
  Do NOT try to make "overallBand" match (FC+LR+GRA+PRON)/4. The application computes the final overall band as the average of the three part bands (part1.band, part2.band, part3.band) for parts that exist in the exam.
  
  ========================
  RESPONSE FORMAT
  ========================
  
  {
    "fluencyCoherence": number,
    "lexicalResource": number,
    "grammar": number,
    "pronunciation": number,
    "overallBand": number,
    "part1": { "band": number, "feedback": string },
    "part2": { "band": number, "feedback": string },
    "part3": { "band": number, "feedback": string },
    "overallFeedback": string
  }
  `;
  const userContent = `Score this IELTS Speaking attempt STRICTLY. Short answers, repetition, missing parts, and informal language should result in LOW bands (4.0-5.0 range).

Input JSON (single payload):\n\n${JSON.stringify(
    {
      part1: payload.part1,
      part2: payload.part2,
      part3: payload.part3,
    },
    null,
    2,
  )}`;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.2, // Lower temperature for more consistent strict scoring
    max_tokens: 3500,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const raw = JSON.parse(content) as Partial<IELTSSpeakingScoreResult>;

  const fc = clampBand(raw.fluencyCoherence ?? 0);
  const lr = clampBand(raw.lexicalResource ?? 0);
  const gra = clampBand(raw.grammar ?? 0);
  const pron = clampBand(raw.pronunciation ?? 0);
  const criteriaAverage = averageBand(fc, lr, gra, pron);

  const buildPart = (
    rawPart: Partial<IELTSSpeakingPartBand> | undefined,
    turns: SpeakingQuestionTurn[],
    criteriaFallback: number,
  ): IELTSSpeakingPartBand => {
    if (isPartCompletelyUnanswered(turns)) {
      return {
        band: clampBand(UNANSWERED_PART_BAND),
        feedback: UNANSWERED_PART_FEEDBACK_AZ,
      };
    }
    if (turns.length === 0) {
      return {
        band: clampBand(rawPart?.band ?? criteriaFallback),
        feedback: typeof rawPart?.feedback === "string" ? rawPart.feedback : "",
      };
    }
    return {
      band: clampBand(rawPart?.band ?? criteriaFallback),
      feedback: typeof rawPart?.feedback === "string" ? rawPart.feedback : "",
    };
  };

  const part1 = buildPart(raw.part1, payload.part1, criteriaAverage);
  const part2 = buildPart(raw.part2, payload.part2, criteriaAverage);
  const part3 = buildPart(raw.part3, payload.part3, criteriaAverage);

  const bandsForOverall: number[] = [];
  if (payload.part1.length > 0) bandsForOverall.push(part1.band);
  if (payload.part2.length > 0) bandsForOverall.push(part2.band);
  if (payload.part3.length > 0) bandsForOverall.push(part3.band);

  const overallBand =
    bandsForOverall.length > 0
      ? overallBandFromPartBands(bandsForOverall)
      : criteriaAverage;

  return {
    fluencyCoherence: fc,
    lexicalResource: lr,
    grammar: gra,
    pronunciation: pron,
    overallBand,
    part1,
    part2,
    part3,
    overallFeedback:
      typeof raw.overallFeedback === "string" ? raw.overallFeedback : "",
  };
}
