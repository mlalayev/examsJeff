export interface ResultsData {
  attemptId: string;
  examTitle: string;
  studentName: string;
  submittedAt: string;
  status: string;
  role: "STUDENT" | "TEACHER";
  summary: {
    totalCorrect: number;
    totalQuestions: number;
    totalPercentage: number;
    perSection?: Array<{
      type: string;
      title: string;
      correct: number;
      total: number;
      percentage: number;
      listeningParts?: {
        s1: number;
        s2: number;
        s3: number;
        s4: number;
      };
    }>;
  };
  sections?: Array<{
    type: string;
    title: string;
    correct: number;
    total: number;
    percentage: number;
    listeningParts?: {
      s1: number;
      s2: number;
      s3: number;
      s4: number;
    };
    questions: Array<{
      id: string;
      qtype: string;
      prompt: any;
      options: any;
      order: number;
      maxScore: number;
      image?: string | null;
      studentAnswer: any;
      correctAnswer: any;
      isCorrect: boolean;
      explanation: any;
    }>;
  }>;
  writingSubmission?: {
    id: string;
    task1Response: string;
    task2Response: string;
    wordCountTask1: number;
    wordCountTask2: number;
    aiTask1Overall: number | null;
    aiTask1TR: number | null;
    aiTask1CC: number | null;
    aiTask1LR: number | null;
    aiTask1GRA: number | null;
    aiTask1Feedback: string | null;
    aiTask2Overall: number | null;
    aiTask2TR: number | null;
    aiTask2CC: number | null;
    aiTask2LR: number | null;
    aiTask2GRA: number | null;
    aiTask2Feedback: string | null;
    aiScoredAt: string | null;
    overallBand?: number | null;
  } | null;
  /** IELTS Speaking AI scores (stored on AttemptSection.rubric.ieltsSpeakingAi) */
  speakingAi?: {
    overallBand: number;
    fluencyCoherence: number;
    lexicalResource: number;
    grammaticalRange: number;
    pronunciation: number;
    feedback: string;
    scoredAt: string;
  } | null;
}
