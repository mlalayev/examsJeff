/**
 * Auto-scoring utility for exam questions
 */

import { QuestionType } from "@prisma/client";

/**
 * Normalize text for comparison (removes punctuation, extra spaces, converts to lowercase)
 * Examples:
 * - "was" → "was"
 * - "wAs" → "was"
 * - "/was" → "was"
 * - "was." → "was"
 * - "   was" → "was"
 * - "is not" / "isn't" → "isnot"
 */
function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    // Remove common punctuation: . , ! ? / \ - _ : ; " ' ( )
    .replace(/[.,!?\\/\-_:;"'()]/g, "")
    // Replace multiple spaces with single space
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Auto-scoring function for question types
 * Returns 1 for correct, 0 for incorrect
 * 
 * Scoring rules:
 * - TF: exact boolean match
 * - MCQ_SINGLE: selected index === answerKey.index
 * - MCQ_MULTI: set(indices) === set(answerKey.indices)
 * - SELECT: selected === answerKey.index
 * - GAP: normalize(trim, lower); any-of answerKey.answers
 * - ORDER_SENTENCE: order array deep-equal
 * - DND_GAP: each blank filled === answerKey.blanks[i] (normalize lower-trim)
 * - SHORT_TEXT/ESSAY: no autoscore (returns 0)
 */
export function scoreQuestion(qtype: QuestionType, studentAnswer: any, answerKey: any): number {
  switch (qtype) {
    case "TF": {
      // Exact boolean match
      return studentAnswer === answerKey?.value ? 1 : 0;
    }
    case "MCQ_SINGLE": {
      // Selected index === answerKey.index
      const correctIdx = answerKey?.index;
      return studentAnswer === correctIdx ? 1 : 0;
    }
    case "MCQ_MULTI": {
      // Set equality: set(indices) === set(answerKey.indices)
      const correctIndices = answerKey?.indices || [];
      if (!Array.isArray(studentAnswer)) return 0;
      const sorted = [...studentAnswer].sort((a, b) => a - b);
      const correctSorted = [...correctIndices].sort((a, b) => a - b);
      if (sorted.length !== correctSorted.length) return 0;
      return sorted.every((v, i) => v === correctSorted[i]) ? 1 : 0;
    }
    case "SELECT": {
      // Selected === answerKey.index
      const correctIdx = answerKey?.index;
      return studentAnswer === correctIdx ? 1 : 0;
    }
    case "GAP": {
      // Normalize (trim, lower, remove punctuation); any-of answerKey.answers
      const acceptedAnswers = answerKey?.answers || [];
      
      // Handle both string and Record<string, string> formats
      let studentText = "";
      if (typeof studentAnswer === "string") {
        studentText = studentAnswer;
      } else if (typeof studentAnswer === "object" && studentAnswer !== null) {
        // Handle { '0': 'answer' } format from QOpenText
        studentText = studentAnswer['0'] || "";
      }
      
      if (!studentText) return 0;
      const normalized = normalizeText(studentText);
      return acceptedAnswers.some((a: string) => {
        if (typeof a !== "string") return false;
        return normalizeText(a) === normalized;
      }) ? 1 : 0;
    }
    case "ORDER_SENTENCE": {
      // Order array deep-equal
      const correctOrder = answerKey?.order || [];
      if (!Array.isArray(studentAnswer)) return 0;
      if (studentAnswer.length !== correctOrder.length) return 0;
      return studentAnswer.every((v, i) => v === correctOrder[i]) ? 1 : 0;
    }
    case "DND_GAP": {
      // Each blank: filled === answerKey.blanks[i] (normalize with punctuation removal)
      const correctBlanks = answerKey?.blanks || [];
      if (!Array.isArray(studentAnswer)) return 0;
      if (studentAnswer.length !== correctBlanks.length) return 0;
      return studentAnswer.every((v, i) => {
        if (typeof v !== "string" || typeof correctBlanks[i] !== "string") return false;
        return normalizeText(v) === normalizeText(correctBlanks[i]);
      }) ? 1 : 0;
    }
    // Writing types (no autoscore)
    case "SHORT_TEXT":
    case "ESSAY":
    default:
      return 0;
  }
}

/**
 * Calculate section score from individual question results
 * 
 * @param questions - Array of questions with their scores
 * @returns Object with rawScore and maxScore
 */
export function calculateSectionScore(questions: Array<{ maxScore: number; isCorrect: boolean }>) {
  let rawScore = 0;
  let maxScore = 0;

  for (const q of questions) {
    const score = q.maxScore || 1;
    maxScore += score;
    if (q.isCorrect) {
      rawScore += score;
    }
  }

  return { rawScore, maxScore };
}

/**
 * Calculate percentage score
 */
export function calculatePercentage(raw: number, max: number): number | null {
  if (max === 0) return null;
  return Math.round((raw / max) * 100);
}
