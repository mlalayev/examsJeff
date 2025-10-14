/**
 * Unit tests for auto-scoring rules
 */

import { QuestionType } from "@prisma/client";

// Import the scoreQuestion function
// Note: In actual implementation, we'd extract scoreQuestion to a separate module
// For now, we'll reimplement it here for testing
function scoreQuestion(qtype: QuestionType, studentAnswer: any, answerKey: any): number {
  switch (qtype) {
    case "TF": {
      return studentAnswer === answerKey?.value ? 1 : 0;
    }
    case "MCQ_SINGLE": {
      const correctIdx = answerKey?.index;
      return studentAnswer === correctIdx ? 1 : 0;
    }
    case "MCQ_MULTI": {
      const correctIndices = answerKey?.indices || [];
      if (!Array.isArray(studentAnswer)) return 0;
      const sorted = [...studentAnswer].sort((a, b) => a - b);
      const correctSorted = [...correctIndices].sort((a, b) => a - b);
      if (sorted.length !== correctSorted.length) return 0;
      return sorted.every((v, i) => v === correctSorted[i]) ? 1 : 0;
    }
    case "SELECT": {
      const correctIdx = answerKey?.index;
      return studentAnswer === correctIdx ? 1 : 0;
    }
    case "GAP": {
      const acceptedAnswers = answerKey?.answers || [];
      if (typeof studentAnswer !== "string") return 0;
      const normalized = studentAnswer.trim().toLowerCase();
      return acceptedAnswers.some((a: string) => {
        if (typeof a !== "string") return false;
        return a.trim().toLowerCase() === normalized;
      }) ? 1 : 0;
    }
    case "ORDER_SENTENCE": {
      const correctOrder = answerKey?.order || [];
      if (!Array.isArray(studentAnswer)) return 0;
      if (studentAnswer.length !== correctOrder.length) return 0;
      return studentAnswer.every((v, i) => v === correctOrder[i]) ? 1 : 0;
    }
    case "DND_GAP": {
      const correctBlanks = answerKey?.blanks || [];
      if (!Array.isArray(studentAnswer)) return 0;
      if (studentAnswer.length !== correctBlanks.length) return 0;
      return studentAnswer.every((v, i) => {
        if (typeof v !== "string" || typeof correctBlanks[i] !== "string") return false;
        return v.trim().toLowerCase() === correctBlanks[i].trim().toLowerCase();
      }) ? 1 : 0;
    }
    case "SHORT_TEXT":
    case "ESSAY":
    default:
      return 0;
  }
}

describe("scoreQuestion - TF", () => {
  test("correct true answer", () => {
    expect(scoreQuestion("TF", true, { value: true })).toBe(1);
  });

  test("correct false answer", () => {
    expect(scoreQuestion("TF", false, { value: false })).toBe(1);
  });

  test("incorrect answer", () => {
    expect(scoreQuestion("TF", true, { value: false })).toBe(0);
    expect(scoreQuestion("TF", false, { value: true })).toBe(0);
  });

  test("null or undefined answer", () => {
    expect(scoreQuestion("TF", null, { value: true })).toBe(0);
    expect(scoreQuestion("TF", undefined, { value: true })).toBe(0);
  });
});

describe("scoreQuestion - MCQ_SINGLE", () => {
  test("correct answer", () => {
    expect(scoreQuestion("MCQ_SINGLE", 1, { index: 1 })).toBe(1);
    expect(scoreQuestion("MCQ_SINGLE", 0, { index: 0 })).toBe(1);
  });

  test("incorrect answer", () => {
    expect(scoreQuestion("MCQ_SINGLE", 0, { index: 1 })).toBe(0);
    expect(scoreQuestion("MCQ_SINGLE", 2, { index: 1 })).toBe(0);
  });

  test("null answer", () => {
    expect(scoreQuestion("MCQ_SINGLE", null, { index: 1 })).toBe(0);
  });
});

describe("scoreQuestion - MCQ_MULTI", () => {
  test("correct answer - same order", () => {
    expect(scoreQuestion("MCQ_MULTI", [0, 1, 2], { indices: [0, 1, 2] })).toBe(1);
  });

  test("correct answer - different order", () => {
    expect(scoreQuestion("MCQ_MULTI", [2, 0, 1], { indices: [0, 1, 2] })).toBe(1);
    expect(scoreQuestion("MCQ_MULTI", [1, 2, 0], { indices: [0, 1, 2] })).toBe(1);
  });

  test("incorrect - missing items", () => {
    expect(scoreQuestion("MCQ_MULTI", [0, 1], { indices: [0, 1, 2] })).toBe(0);
  });

  test("incorrect - extra items", () => {
    expect(scoreQuestion("MCQ_MULTI", [0, 1, 2, 3], { indices: [0, 1, 2] })).toBe(0);
  });

  test("incorrect - wrong items", () => {
    expect(scoreQuestion("MCQ_MULTI", [0, 1, 3], { indices: [0, 1, 2] })).toBe(0);
  });

  test("empty arrays", () => {
    expect(scoreQuestion("MCQ_MULTI", [], { indices: [] })).toBe(1);
    expect(scoreQuestion("MCQ_MULTI", [], { indices: [0] })).toBe(0);
  });

  test("non-array answer", () => {
    expect(scoreQuestion("MCQ_MULTI", null, { indices: [0, 1] })).toBe(0);
    expect(scoreQuestion("MCQ_MULTI", "string", { indices: [0, 1] })).toBe(0);
  });
});

describe("scoreQuestion - SELECT", () => {
  test("correct answer", () => {
    expect(scoreQuestion("SELECT", 2, { index: 2 })).toBe(1);
    expect(scoreQuestion("SELECT", 0, { index: 0 })).toBe(1);
  });

  test("incorrect answer", () => {
    expect(scoreQuestion("SELECT", 1, { index: 2 })).toBe(0);
  });
});

describe("scoreQuestion - GAP", () => {
  test("exact match", () => {
    expect(scoreQuestion("GAP", "answer", { answers: ["answer"] })).toBe(1);
  });

  test("case insensitive", () => {
    expect(scoreQuestion("GAP", "Answer", { answers: ["answer"] })).toBe(1);
    expect(scoreQuestion("GAP", "ANSWER", { answers: ["answer"] })).toBe(1);
    expect(scoreQuestion("GAP", "answer", { answers: ["ANSWER"] })).toBe(1);
  });

  test("trim whitespace", () => {
    expect(scoreQuestion("GAP", "  answer  ", { answers: ["answer"] })).toBe(1);
    expect(scoreQuestion("GAP", "answer", { answers: ["  answer  "] })).toBe(1);
    expect(scoreQuestion("GAP", "  answer  ", { answers: ["  answer  "] })).toBe(1);
  });

  test("multiple accepted answers", () => {
    expect(scoreQuestion("GAP", "buy", { answers: ["buy", "purchase", "get"] })).toBe(1);
    expect(scoreQuestion("GAP", "purchase", { answers: ["buy", "purchase", "get"] })).toBe(1);
    expect(scoreQuestion("GAP", "get", { answers: ["buy", "purchase", "get"] })).toBe(1);
  });

  test("incorrect answer", () => {
    expect(scoreQuestion("GAP", "wrong", { answers: ["buy", "purchase"] })).toBe(0);
  });

  test("non-string answer", () => {
    expect(scoreQuestion("GAP", null, { answers: ["answer"] })).toBe(0);
    expect(scoreQuestion("GAP", 123, { answers: ["answer"] })).toBe(0);
  });

  test("empty answer", () => {
    expect(scoreQuestion("GAP", "", { answers: ["answer"] })).toBe(0);
  });
});

describe("scoreQuestion - ORDER_SENTENCE", () => {
  test("correct order", () => {
    expect(scoreQuestion("ORDER_SENTENCE", [2, 0, 1, 5, 4, 3], { order: [2, 0, 1, 5, 4, 3] })).toBe(1);
  });

  test("incorrect order", () => {
    expect(scoreQuestion("ORDER_SENTENCE", [0, 1, 2, 3, 4, 5], { order: [2, 0, 1, 5, 4, 3] })).toBe(0);
    expect(scoreQuestion("ORDER_SENTENCE", [2, 1, 0, 5, 4, 3], { order: [2, 0, 1, 5, 4, 3] })).toBe(0);
  });

  test("wrong length", () => {
    expect(scoreQuestion("ORDER_SENTENCE", [2, 0, 1], { order: [2, 0, 1, 5, 4, 3] })).toBe(0);
    expect(scoreQuestion("ORDER_SENTENCE", [2, 0, 1, 5, 4, 3, 6], { order: [2, 0, 1, 5, 4, 3] })).toBe(0);
  });

  test("non-array answer", () => {
    expect(scoreQuestion("ORDER_SENTENCE", null, { order: [0, 1, 2] })).toBe(0);
    expect(scoreQuestion("ORDER_SENTENCE", "string", { order: [0, 1, 2] })).toBe(0);
  });
});

describe("scoreQuestion - DND_GAP", () => {
  test("exact match", () => {
    expect(scoreQuestion("DND_GAP", ["go", "come"], { blanks: ["go", "come"] })).toBe(1);
  });

  test("case insensitive", () => {
    expect(scoreQuestion("DND_GAP", ["GO", "COME"], { blanks: ["go", "come"] })).toBe(1);
    expect(scoreQuestion("DND_GAP", ["Go", "Come"], { blanks: ["go", "come"] })).toBe(1);
  });

  test("trim whitespace", () => {
    expect(scoreQuestion("DND_GAP", ["  go  ", "  come  "], { blanks: ["go", "come"] })).toBe(1);
    expect(scoreQuestion("DND_GAP", ["go", "come"], { blanks: ["  go  ", "  come  "] })).toBe(1);
  });

  test("incorrect answers", () => {
    expect(scoreQuestion("DND_GAP", ["come", "go"], { blanks: ["go", "come"] })).toBe(0);
    expect(scoreQuestion("DND_GAP", ["go", "wrong"], { blanks: ["go", "come"] })).toBe(0);
  });

  test("wrong length", () => {
    expect(scoreQuestion("DND_GAP", ["go"], { blanks: ["go", "come"] })).toBe(0);
    expect(scoreQuestion("DND_GAP", ["go", "come", "extra"], { blanks: ["go", "come"] })).toBe(0);
  });

  test("non-array answer", () => {
    expect(scoreQuestion("DND_GAP", null, { blanks: ["go", "come"] })).toBe(0);
    expect(scoreQuestion("DND_GAP", "string", { blanks: ["go", "come"] })).toBe(0);
  });

  test("empty strings", () => {
    expect(scoreQuestion("DND_GAP", ["", ""], { blanks: ["go", "come"] })).toBe(0);
  });

  test("non-string elements", () => {
    expect(scoreQuestion("DND_GAP", [123, 456], { blanks: ["go", "come"] })).toBe(0);
  });
});

describe("scoreQuestion - Writing types", () => {
  test("SHORT_TEXT always returns 0 (no autoscore)", () => {
    expect(scoreQuestion("SHORT_TEXT", "any answer", { answer: "any answer" })).toBe(0);
  });

  test("ESSAY always returns 0 (no autoscore)", () => {
    expect(scoreQuestion("ESSAY", "long essay text", { answer: "long essay text" })).toBe(0);
  });
});

// Edge cases and integration tests
describe("scoreQuestion - Edge cases", () => {
  test("missing answerKey", () => {
    expect(scoreQuestion("MCQ_SINGLE", 1, null)).toBe(0);
    expect(scoreQuestion("GAP", "answer", null)).toBe(0);
  });

  test("empty answerKey", () => {
    expect(scoreQuestion("MCQ_MULTI", [0], { indices: [] })).toBe(0);
    expect(scoreQuestion("GAP", "answer", { answers: [] })).toBe(0);
  });
});

export { scoreQuestion };

