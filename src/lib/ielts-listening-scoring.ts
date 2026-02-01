import { scoreQuestion, QuestionType } from "./scoring";
import { getIELTSListeningPart } from "./ielts-listening-helper";

/**
 * Score IELTS Listening with 4-part breakdown
 * 
 * Returns:
 * - sectionScores: {s1: number, s2: number, s3: number, s4: number}
 * - totalRaw: number (0-40)
 * - maxScore: 40
 */
export function scoreIELTSListening(
  questions: Array<{
    id: string;
    qtype: string;
    answerKey: any;
    maxScore?: number;
    order: number; // 0-based
  }>,
  answers: Record<string, any>
): {
  sectionScores: { s1: number; s2: number; s3: number; s4: number };
  totalRaw: number;
  maxScore: number;
} {
  const partScores = { s1: 0, s2: 0, s3: 0, s4: 0 };
  let totalRaw = 0;

  for (const q of questions) {
    try {
      const qtype = q.qtype as QuestionType;
      const answer = answers[q.id];
      const correct = scoreQuestion(qtype, answer, q.answerKey);
      
      // Get part number (1-4) based on question order (0-based)
      const part = getIELTSListeningPart(q.order + 1); // Convert to 1-based
      
      // Each question worth 1 point (IELTS standard)
      const score = correct ? 1 : 0;
      totalRaw += score;
      
      // Add to part score
      if (part === 1) partScores.s1 += score;
      else if (part === 2) partScores.s2 += score;
      else if (part === 3) partScores.s3 += score;
      else if (part === 4) partScores.s4 += score;
    } catch (err) {
      console.error(`Error scoring IELTS Listening question ${q.id}:`, err);
    }
  }

  return {
    sectionScores: partScores,
    totalRaw,
    maxScore: 40,
  };
}

/**
 * Validate IELTS Listening submission
 */
export function validateIELTSListeningSubmission(
  questions: any[]
): { valid: boolean; error?: string } {
  if (questions.length !== 40) {
    return {
      valid: false,
      error: `IELTS Listening must have 40 questions (found ${questions.length})`,
    };
  }
  return { valid: true };
}





