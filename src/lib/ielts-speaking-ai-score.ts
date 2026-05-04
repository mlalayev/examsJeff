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
  You are a certified IELTS Speaking examiner. Apply official public-band descriptors fairly: reward what the candidate achieves, penalise only what the evidence clearly shows, and avoid systematically harsh scoring.
  
  You receive ONE JSON object containing:
  - part1: array of { prompt, transcript }
  - part2: array of { prompt, transcript }
  - part3: array of { prompt, transcript }
  
  Your task is to evaluate the candidate using official IELTS criteria (not stricter than a typical real test).
  
  ========================
  SCORING CRITERIA (0–9, half-band allowed)
  ========================
  
  1. Fluency & Coherence (FC)
  - Natural flow of speech
  - Logical development of ideas
  - Hesitation, repetition, abrupt endings lower the score in proportion to how much they block communication
  
  2. Lexical Resource (LR)
  - Vocabulary range and flexibility
  - Paraphrasing ability
  - Noticeable repetition lowers LR; occasional informal words in Part 1 are normal—penalise only if inappropriate or constant
  
  3. Grammatical Range & Accuracy (GRA)
  - Variety of sentence structures
  - Accuracy of grammar
  - Mostly simple but accurate structures can still reach mid bands if communication is clear
  
  4. Pronunciation (PRON)
  - Clarity and intelligibility matter most
  - Minor accent or transcript noise should not cap the band if meaning is clear
  
  ========================
  WHEN TO LOWER THE BAND
  ========================
  
  - Missing or almost no content in Part 2 or Part 3 → apply a clear penalty, but keep bands consistent with how much was actually said
  - Very short answers where the task required development → lower the relevant part band appropriately
  - Thin content (few examples) may cap that part slightly, but not below what descriptors justify (typical cap guidance: around 6.5–7.0 for that dimension if ideas are otherwise adequate)
  - Heavy repetition of the same simple words → cap LR modestly (around 6.0–6.5), not automatically very low
  - Only basic grammar with many errors → reflect in GRA; if communication is still mostly successful, avoid bottom-of-scale scores
  
  ========================
  IMPORTANT RULES
  ========================
  
  - Use the full 0–9 scale; do not cluster everyone in 4.0–5.5 unless performance truly matches those descriptors
  - If performance sits between two half-bands, choose the one best supported by evidence (slight lean either way is OK—avoid always picking the lower)
  - Nervous but understandable answers in Part 1 should not drag the whole test down unfairly
  
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
  const userContent = `Score this IELTS Speaking attempt fairly against official criteria. Penalise missing parts and off-task answers clearly, but give credit for successful communication, adequate range, and clear ideas.

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
    temperature: 0.35, // Slightly higher for balanced, less systematically harsh bands
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
