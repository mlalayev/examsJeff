import { prisma } from "./prisma";

interface QuestionWithAnswer {
  id: string;
  sectionType: string;
  qtype: string;
  prompt: any;
  options: any;
  answerKey: any;
  maxScore: number;
  order: number;
}

interface StudentAnswer {
  [questionId: string]: any;
}

interface ScoringResult {
  rawScore: number;
  maxRawScore: number;
  correctCount: number;
  totalQuestions: number;
  breakdown: Array<{
    questionId: string;
    order: number;
    isCorrect: boolean;
    studentAnswer: any;
    correctAnswer: any;
    points: number;
  }>;
}

/**
 * Compare student answer with answer key
 * Handles multiple question types
 */
function isAnswerCorrect(studentAnswer: any, answerKey: any, qtype: string): boolean {
  if (!studentAnswer || !answerKey) return false;

  const correct = answerKey.correct;
  if (!correct) return false;

  // Normalize for comparison
  const normalize = (val: any) => 
    String(val).toLowerCase().trim().replace(/[^\w\s]/g, '');

  switch (qtype) {
    case 'multiple_choice':
    case 'true_false_not_given':
      // Exact match (case insensitive)
      return normalize(studentAnswer) === normalize(correct);

    case 'fill_in_blank':
    case 'short_answer':
      // Check if answer matches any acceptable answer
      if (Array.isArray(correct)) {
        return correct.some(ans => normalize(studentAnswer) === normalize(ans));
      }
      return normalize(studentAnswer) === normalize(correct);

    case 'matching':
      // Compare objects
      if (typeof correct === 'object' && typeof studentAnswer === 'object') {
        const correctKeys = Object.keys(correct);
        return correctKeys.every(key => 
          normalize(studentAnswer[key]) === normalize(correct[key])
        );
      }
      return false;

    case 'note_completion':
    case 'summary_completion':
      // Array comparison
      if (Array.isArray(correct) && Array.isArray(studentAnswer)) {
        return correct.every((ans, idx) => 
          normalize(studentAnswer[idx]) === normalize(ans)
        );
      }
      return false;

    default:
      // Default: string comparison
      return normalize(studentAnswer) === normalize(correct);
  }
}

/**
 * Score a section based on student answers
 */
export async function scoreSection(
  questions: QuestionWithAnswer[],
  studentAnswers: StudentAnswer
): Promise<ScoringResult> {
  let rawScore = 0;
  let maxRawScore = 0;
  let correctCount = 0;
  const breakdown: ScoringResult['breakdown'] = [];

  for (const question of questions) {
    const studentAnswer = studentAnswers[question.id];
    const isCorrect = isAnswerCorrect(studentAnswer, question.answerKey, question.qtype);
    const points = isCorrect ? question.maxScore : 0;

    rawScore += points;
    maxRawScore += question.maxScore;
    if (isCorrect) correctCount++;

    breakdown.push({
      questionId: question.id,
      order: question.order,
      isCorrect,
      studentAnswer,
      correctAnswer: question.answerKey?.correct,
      points,
    });
  }

  return {
    rawScore,
    maxRawScore,
    correctCount,
    totalQuestions: questions.length,
    breakdown,
  };
}

/**
 * Look up band score from BandMap
 */
export async function getBandScore(
  examType: string,
  sectionType: string,
  rawScore: number
): Promise<number | null> {
  const bandMap = await prisma.bandMap.findFirst({
    where: {
      examType,
      section: sectionType as any,
      minRaw: { lte: rawScore },
      maxRaw: { gte: rawScore },
    },
  });

  return bandMap?.band ?? null;
}

/**
 * Apply IELTS rounding rules
 * Rounds to nearest 0.5 (but uses .25/.75 for intermediate values)
 * Examples:
 *   6.125 → 6.0
 *   6.25  → 6.5
 *   6.375 → 6.5
 *   6.5   → 6.5
 *   6.625 → 6.5
 *   6.75  → 7.0
 *   6.875 → 7.0
 */
export function applyIELTSRounding(average: number): number {
  const decimal = average - Math.floor(average);
  
  if (decimal < 0.25) {
    return Math.floor(average);
  } else if (decimal < 0.75) {
    return Math.floor(average) + 0.5;
  } else {
    return Math.ceil(average);
  }
}

/**
 * Calculate overall band from section bands
 */
export function calculateOverallBand(sectionBands: number[]): number {
  if (sectionBands.length === 0) return 0;
  
  const average = sectionBands.reduce((sum, band) => sum + band, 0) / sectionBands.length;
  return applyIELTSRounding(average);
}

/**
 * Complete scoring workflow for an attempt
 */
export async function scoreAttempt(attemptId: string) {
  // Get attempt with all data
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      sections: true,
      booking: {
        include: {
          exam: {
            include: {
              questions: {
                orderBy: { order: 'asc' }
              }
            }
          }
        }
      }
    }
  });

  if (!attempt) {
    throw new Error('Attempt not found');
  }

  const examType = attempt.booking.exam.examType;
  const sectionBands: number[] = [];

  // Score each section
  for (const section of attempt.sections) {
    if (section.type === 'READING' || section.type === 'LISTENING') {
      // Auto-grade
      const questions = attempt.booking.exam.questions.filter(
        q => q.sectionType === section.type
      );

      if (questions.length === 0) continue;

      const studentAnswers = (section.answers as StudentAnswer) || {};
      const scoringResult = await scoreSection(questions, studentAnswers);
      
      // Look up band score
      const bandScore = await getBandScore(examType, section.type, scoringResult.rawScore);

      // Update section
      await prisma.attemptSection.update({
        where: { id: section.id },
        data: {
          rawScore: scoringResult.rawScore,
          bandScore: bandScore ?? undefined,
        }
      });

      if (bandScore !== null) {
        sectionBands.push(bandScore);
      }
    } else if (section.type === 'WRITING' || section.type === 'SPEAKING') {
      // Manual grading - skip for now, but if already graded, include
      if (section.bandScore !== null) {
        sectionBands.push(section.bandScore);
      }
    }
  }

  // Calculate overall band
  const overallBand = sectionBands.length > 0 
    ? calculateOverallBand(sectionBands) 
    : null;

  // Update attempt
  await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      bandOverall: overallBand,
    }
  });

  return {
    overallBand,
    sectionBands,
  };
}

