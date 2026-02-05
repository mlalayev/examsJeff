export type ExamCategory = "IELTS" | "TOEFL" | "SAT" | "GENERAL_ENGLISH" | "MATH" | "KIDS";
export type SectionType = "READING" | "LISTENING" | "WRITING" | "SPEAKING" | "GRAMMAR" | "VOCABULARY";
export type QuestionType = 
  | "MCQ_SINGLE" 
  | "MCQ_MULTI" 
  | "TF" 
  | "TF_NG"
  | "ORDER_SENTENCE" 
  | "DND_GAP" 
  | "SHORT_TEXT" 
  | "ESSAY"
  | "INLINE_SELECT";

export interface Section {
  id: string;
  type: SectionType;
  title: string;
  instruction: string;
  durationMin: number;
  order: number;
  questions: Question[];
  passage?: string;
  audio?: string;
  image?: string;
  image2?: string;
  introduction?: string;
  subsections?: Section[];
  isSubsection?: boolean;
  parentId?: string;
}

export interface Question {
  id: string;
  qtype: QuestionType;
  order: number;
  prompt: any;
  options?: any;
  answerKey: any;
  maxScore: number;
  explanation?: any;
  image?: string;
}

