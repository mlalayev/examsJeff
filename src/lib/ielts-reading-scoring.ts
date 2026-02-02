/**
 * IELTS Reading Scoring Module
 * 
 * IELTS Reading has 40 questions across 3 passages:
 * - Passage 1: Questions 1-13 (13 questions, easier)
 * - Passage 2: Questions 14-26 (13 questions, medium)
 * - Passage 3: Questions 27-40 (14 questions, harder)
 * 
 * Each correct answer = 1 raw point
 * Total raw score: 0-40
 */

import { scoreQuestion } from "./scoring";

interface Question {
  id: string;
  qtype: string;
  answerKey: any;
  maxScore: number;
  order: number; // 0-based index
}

interface PassageScore {
  passage: number; // 1, 2, or 3
  rawScore: number;
  maxScore: number;
  questionRange: [number, number]; // e.g., [1, 13]
}

interface IELTSReadingScore {
  passageScores: PassageScore[];
  totalRawScore: number;
  maxScore: number;
}

/**
 * Determine which passage a question belongs to based on its order
 * IELTS Reading structure:
 * - Passage 1: Q1-13 (orders 0-12)
 * - Passage 2: Q14-26 (orders 13-25)
 * - Passage 3: Q27-40 (orders 26-39)
 */
function getPassageNumber(order: number): number {
  if (order <= 12) return 1; // Q1-13 (orders 0-12)
  if (order <= 25) return 2; // Q14-26 (orders 13-25)
  return 3; // Q27-40 (orders 26-39)
}

/**
 * Score IELTS Reading section with passage-level breakdown
 */
export function scoreIELTSReading(
  questions: Question[],
  answers: Record<string, any>
): IELTSReadingScore {
  // Group questions by passage
  const passageQuestions: Record<number, Question[]> = {
    1: [],
    2: [],
    3: [],
  };

  questions.forEach((q) => {
    const passage = getPassageNumber(q.order);
    passageQuestions[passage].push(q);
  });

  // Score each passage
  const passageScores: PassageScore[] = [];
  let totalRawScore = 0;
  let totalMaxScore = 0;

  for (const passageNum of [1, 2, 3]) {
    const passageQs = passageQuestions[passageNum];
    let passageRaw = 0;
    let passageMax = 0;

    passageQs.forEach((q) => {
      const answer = answers[q.id];
      const correct = scoreQuestion(q.qtype as any, answer, q.answerKey);
      
      if (correct) {
        passageRaw += q.maxScore || 1;
      }
      passageMax += q.maxScore || 1;
    });

    // Determine question range
    const questionRange: [number, number] = 
      passageNum === 1 ? [1, 13] :
      passageNum === 2 ? [14, 26] :
      [27, 40];

    passageScores.push({
      passage: passageNum,
      rawScore: passageRaw,
      maxScore: passageMax,
      questionRange,
    });

    totalRawScore += passageRaw;
    totalMaxScore += passageMax;
  }

  return {
    passageScores,
    totalRawScore,
    maxScore: totalMaxScore,
  };
}


