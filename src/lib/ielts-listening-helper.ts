/**
 * IELTS Listening Structure Helper
 * 
 * IELTS Listening has 4 parts, 40 questions total (10 per part)
 */

export const IELTS_LISTENING_STRUCTURE = {
  totalParts: 4,
  questionsPerPart: 10,
  totalQuestions: 40,
  parts: [
    {
      id: 1,
      title: "Part 1",
      description: "Conversation between two people set in an everyday social context",
      questionRange: [1, 10],
    },
    {
      id: 2,
      title: "Part 2",
      description: "Monologue set in an everyday social context",
      questionRange: [11, 20],
    },
    {
      id: 3,
      title: "Part 3",
      description: "Conversation between up to four people set in an educational or training context",
      questionRange: [21, 30],
    },
    {
      id: 4,
      title: "Part 4",
      description: "Monologue on an academic subject",
      questionRange: [31, 40],
    },
  ],
} as const;

/**
 * Get the part number for a given question order (1-based)
 */
export function getIELTSListeningPart(questionOrder: number): number {
  if (questionOrder <= 10) return 1;
  if (questionOrder <= 20) return 2;
  if (questionOrder <= 30) return 3;
  return 4;
}

/**
 * Group questions by IELTS Listening parts
 */
export function groupIELTSListeningQuestions<T extends { order: number }>(
  questions: T[]
): Record<number, T[]> {
  const grouped: Record<number, T[]> = { 1: [], 2: [], 3: [], 4: [] };
  
  questions.forEach(q => {
    const part = getIELTSListeningPart(q.order + 1); // order is 0-based
    grouped[part].push(q);
  });
  
  return grouped;
}

/**
 * Check if questions meet IELTS Listening requirements
 */
export function validateIELTSListeningQuestions(questions: any[]): {
  valid: boolean;
  error?: string;
} {
  if (questions.length !== IELTS_LISTENING_STRUCTURE.totalQuestions) {
    return {
      valid: false,
      error: `IELTS Listening must have exactly ${IELTS_LISTENING_STRUCTURE.totalQuestions} questions (found ${questions.length})`,
    };
  }
  
  return { valid: true };
}





