import { Headphones, BookOpen, PenTool, Mic } from "lucide-react";
import type { SectionType, QuestionType, ExamCategory, Section } from "./types";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MCQ_SINGLE: "Multiple Choice (Single)",
  MCQ_MULTI: "Multiple Choice (Multiple)",
  TF: "True/False",
  TF_NG: "True / False / Not Given",
  INLINE_SELECT: "Inline Select",
  ORDER_SENTENCE: "Order Sentence (Drag & Drop)",
  DND_GAP: "Drag & Drop Gap Fill",
  SHORT_TEXT: "Short Text Answer",
  ESSAY: "Essay",
  FILL_IN_BLANK: "Fill in the Blank",
  SPEAKING_RECORDING: "Speaking Recording (IELTS)",
};

export const QUESTION_TYPE_GROUPS = {
  "Variantlı sual": ["MCQ_SINGLE", "MCQ_MULTI", "TF", "TF_NG", "INLINE_SELECT"],
  "Açıq sual": ["SHORT_TEXT", "ESSAY", "FILL_IN_BLANK"],
  "Drag and Drop": ["ORDER_SENTENCE", "DND_GAP"],
  "IELTS Speaking": ["SPEAKING_RECORDING"],
};

export const ALLOWED_SECTIONS_BY_CATEGORY: Record<ExamCategory, SectionType[]> = {
  IELTS: ["READING", "LISTENING", "WRITING", "SPEAKING"],
  TOEFL: ["READING", "LISTENING", "WRITING", "SPEAKING"],
  SAT: ["READING", "WRITING"],
  GENERAL_ENGLISH: ["READING", "LISTENING", "WRITING", "GRAMMAR", "VOCABULARY"],
  MATH: ["GRAMMAR", "VOCABULARY"],
  KIDS: ["READING", "LISTENING", "GRAMMAR", "VOCABULARY"],
};

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  READING: "Reading",
  LISTENING: "Listening",
  WRITING: "Writing",
  SPEAKING: "Speaking",
  GRAMMAR: "Grammar",
  VOCABULARY: "Vocabulary",
};

export const getSectionLabel = (
  type: SectionType,
  selectedCategory: ExamCategory | null
): string => {
  if (selectedCategory === "SAT") {
    if (type === "READING") return "Verbal";
    if (type === "WRITING") return "Math";
  }
  return SECTION_TYPE_LABELS[type];
};

export const IELTS_SECTION_COLORS: Record<SectionType, { border: string; bg: string; iconBg: string }> = {
  LISTENING: { border: "#3B82F6", bg: "#EFF6FF", iconBg: "#3B82F6" },
  READING: { border: "#10B981", bg: "#ECFDF5", iconBg: "#10B981" },
  WRITING: { border: "#F59E0B", bg: "#FFFBEB", iconBg: "#F59E0B" },
  SPEAKING: { border: "#EF4444", bg: "#FEF2F2", iconBg: "#EF4444" },
  GRAMMAR: { border: "#8B5CF6", bg: "#F5F3FF", iconBg: "#8B5CF6" },
  VOCABULARY: { border: "#EC4899", bg: "#FDF2F8", iconBg: "#EC4899" },
};

export const IELTS_SECTION_ICONS: Record<SectionType, typeof Headphones> = {
  LISTENING: Headphones,
  READING: BookOpen,
  WRITING: PenTool,
  SPEAKING: Mic,
  GRAMMAR: BookOpen,
  VOCABULARY: BookOpen,
};

export const IELTS_SECTION_DURATIONS: Record<SectionType, number> = {
  LISTENING: 30,
  READING: 60,
  WRITING: 60,
  SPEAKING: 11,
  GRAMMAR: 15,
  VOCABULARY: 15,
};

export const IELTS_SECTION_INSTRUCTIONS: Record<SectionType, string> = {
  LISTENING: "You will hear a number of different recordings and you will have to answer questions on what you hear. There will be time for you to read the instructions and questions and you will have a chance to check your work. All the recordings will be played ONCE only.",
  READING: "You should spend about 20 minutes on each of the three reading passages. The test contains 40 questions. Each question carries one mark.",
  WRITING: "You should spend about 20 minutes on Task 1 and 40 minutes on Task 2. You must write at least 150 words for Task 1 and 250 words for Task 2.",
  SPEAKING: "The Speaking test consists of three parts. The test takes between 11 and 14 minutes. You will speak to a certified IELTS examiner.",
  GRAMMAR: "Complete the grammar section",
  VOCABULARY: "Complete the vocabulary section",
};

export const IELTS_SECTION_ORDER: Record<SectionType, number> = {
  LISTENING: 0,
  READING: 1,
  WRITING: 2,
  SPEAKING: 3,
  GRAMMAR: 4,
  VOCABULARY: 5,
};

export const sortIELTSSections = (sections: any[]): any[] => {
  return [...sections].sort((a, b) => {
    const aOrder = IELTS_SECTION_ORDER[a.type] ?? 99;
    const bOrder = IELTS_SECTION_ORDER[b.type] ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.order - b.order;
  });
};

export const getIELTSSectionDuration = (type: SectionType): number => {
  return IELTS_SECTION_DURATIONS[type] || 15;
};

export const validateIELTSListeningUniqueness = (
  sections: Section[],
  type?: SectionType
): { valid: boolean; error?: string } => {
  const listeningSections = sections.filter(s => s.type === "LISTENING");
  if (listeningSections.length > 1) {
    return {
      valid: false,
      error: "LISTENING section can only be added once per IELTS exam",
    };
  }
  return { valid: true };
};

