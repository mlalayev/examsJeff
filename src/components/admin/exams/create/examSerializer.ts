import type { Section, Question, ExamCategory } from "./types";

/**
 * Flattened section for API
 */
export interface FlattenedSection {
  type: string;
  title: string;
  instruction: string;
  image: string | null;
  image2: string | null;
  parentSectionId: string | null;
  parentTitle: string | null;
  parentOrder: number | null;
  durationMin: number;
  order: number;
  questions: SerializedQuestion[];
}

/**
 * Serialized question for API
 */
export interface SerializedQuestion {
  qtype: string;
  order: number;
  prompt: any;
  options?: any;
  answerKey: any;
  maxScore: number;
  explanation?: string;
  image: string | null;
}

/**
 * Exam payload for API
 */
export interface ExamPayload {
  title: string;
  category: ExamCategory;
  track: string | null;
  readingType: null;
  writingType: null;
  durationMin: number | null;
  sections: FlattenedSection[];
}

/**
 * Flatten sections with subsections
 * IELTS Listening has subsections that need to be flattened
 */
export function flattenSections(sections: Section[]): Section[] {
  const flattened: Section[] = [];

  for (const section of sections) {
    if (section.subsections && section.subsections.length > 0) {
      section.subsections.forEach((sub, idx) => {
        flattened.push({
          ...sub,
          audio: section.audio,
          order: section.order * 1000 + idx,
          parentTitle: section.title,
          parentOrder: section.order,
        });
      });
    } else {
      flattened.push(section);
    }
  }

  return flattened;
}

/**
 * Build instruction data from section fields
 */
function buildInstructionData(section: Section): any {
  const instructionData: any = {
    text: section.instruction,
  };

  if (section.passage) {
    instructionData.passage = section.passage;
  }
  if (section.audio) {
    instructionData.audio = section.audio;
  }
  if (section.introduction) {
    instructionData.introduction = section.introduction;
  }
  if (section.image) {
    instructionData.image = section.image;
  }
  if (section.image2) {
    instructionData.image2 = section.image2;
  }

  return instructionData;
}

/**
 * Apply category-specific duration overrides
 */
function applyCategoryDurationOverrides(
  sectionDurationMin: number,
  category: ExamCategory,
  sectionType: string
): number {
  if (category === "SAT") {
    if (sectionType === "WRITING") {
      return 35;
    } else if (sectionType === "READING") {
      return 32;
    }
  }

  return sectionDurationMin;
}

/**
 * Serialize a question for API
 */
function serializeQuestion(question: Question): SerializedQuestion {
  return {
    qtype: question.qtype,
    order: question.order,
    prompt: question.prompt,
    options: question.options,
    answerKey: question.answerKey,
    maxScore: question.maxScore,
    explanation: question.explanation,
    image: question.image || null,
  };
}

/**
 * Serialize a section for API
 */
function serializeSection(
  section: Section,
  index: number,
  category: ExamCategory
): FlattenedSection {
  const instructionData = buildInstructionData(section);
  const sectionDurationMin = applyCategoryDurationOverrides(
    section.durationMin,
    category,
    section.type
  );

  return {
    type: section.type,
    title: section.title,
    instruction: JSON.stringify(instructionData),
    image: section.image || null,
    image2: section.image2 || null,
    parentSectionId: section.parentSectionId || null,
    parentTitle: section.parentTitle || null,
    parentOrder: section.parentOrder !== undefined ? section.parentOrder : null,
    durationMin: sectionDurationMin,
    order: index,
    questions: (section.questions || []).map(serializeQuestion),
  };
}

/**
 * Build complete exam payload for API
 */
export function buildExamPayload(
  title: string,
  category: ExamCategory,
  track: string,
  durationMin: number | null,
  sections: Section[]
): ExamPayload {
  const flattenedSections = flattenSections(sections);

  return {
    title,
    category,
    track: track || null,
    readingType: null,
    writingType: null,
    durationMin: durationMin || null,
    sections: flattenedSections.map((s, idx) => serializeSection(s, idx, category)),
  };
}
