import type { ExamCategory, SectionType, QuestionType } from "./types";

/**
 * Context needed to determine allowed question types
 */
export interface QuestionTypeContext {
  examCategory: ExamCategory;
  sectionType: SectionType;
  ieltsContext?: {
    part: number;
  };
}

/**
 * Question type restrictions by section type
 * Most question types are allowed in most sections
 */
const QUESTION_TYPE_RESTRICTIONS: Partial<Record<SectionType, QuestionType[]>> = {
  SPEAKING: ["SPEAKING_RECORDING", "SHORT_TEXT", "ESSAY"],
  WRITING: ["ESSAY", "SHORT_TEXT"],
};

/**
 * Question types that are ONLY for specific contexts
 */
const CONTEXT_SPECIFIC_TYPES: Partial<Record<QuestionType, (ctx: QuestionTypeContext) => boolean>> = {
  SPEAKING_RECORDING: (ctx) => ctx.examCategory === "IELTS" && ctx.sectionType === "SPEAKING",
};

/**
 * Get all question types allowed for a given context
 * This is the SINGLE SOURCE OF TRUTH for what types can be used where
 */
export function getAllowedQuestionTypes(context: QuestionTypeContext): QuestionType[] {
  const { sectionType, examCategory } = context;
  
  // If section has restrictions, use those
  if (QUESTION_TYPE_RESTRICTIONS[sectionType]) {
    return QUESTION_TYPE_RESTRICTIONS[sectionType]!.filter(type => {
      // Check context-specific restrictions
      if (CONTEXT_SPECIFIC_TYPES[type]) {
        return CONTEXT_SPECIFIC_TYPES[type]!(context);
      }
      return true;
    });
  }
  
  // Otherwise, allow all types except context-specific ones that don't match
  const allTypes: QuestionType[] = [
    "MCQ_SINGLE",
    "MCQ_MULTI",
    "TF",
    "TF_NG",
    "INLINE_SELECT",
    "ORDER_SENTENCE",
    "DND_GAP",
    "SHORT_TEXT",
    "ESSAY",
    "FILL_IN_BLANK",
    "SPEAKING_RECORDING",
    "IMAGE_INTERACTIVE",
    "HTML_CSS",
  ];
  
  return allTypes.filter(type => {
    // Filter out context-specific types that don't match current context
    if (CONTEXT_SPECIFIC_TYPES[type]) {
      return CONTEXT_SPECIFIC_TYPES[type]!(context);
    }
    return true;
  });
}

/**
 * Check if a specific question type is allowed in the given context
 * Used for validation
 */
export function isQuestionTypeAllowed(
  context: QuestionTypeContext,
  questionType: QuestionType
): boolean {
  const allowedTypes = getAllowedQuestionTypes(context);
  return allowedTypes.includes(questionType);
}

/**
 * Get allowed question types grouped for display in modal
 * Filters the standard groups based on what's allowed
 */
export function getGroupedQuestionTypes(context: QuestionTypeContext): Record<string, QuestionType[]> {
  const allowedTypes = getAllowedQuestionTypes(context);
  
  const groups: Record<string, QuestionType[]> = {
    "Variantlı sual": ["MCQ_SINGLE", "MCQ_MULTI", "TF", "TF_NG", "INLINE_SELECT"],
    "Açıq sual": ["SHORT_TEXT", "ESSAY", "FILL_IN_BLANK"],
    "Drag and Drop": ["ORDER_SENTENCE", "DND_GAP"],
    "Interactive": ["IMAGE_INTERACTIVE"],
    "Kodlama": ["HTML_CSS"],
    "IELTS Speaking": ["SPEAKING_RECORDING"],
  };
  
  // Filter each group to only include allowed types
  const filteredGroups: Record<string, QuestionType[]> = {};
  for (const [groupName, types] of Object.entries(groups)) {
    const filteredTypes = types.filter(t => allowedTypes.includes(t));
    if (filteredTypes.length > 0) {
      filteredGroups[groupName] = filteredTypes;
    }
  }
  
  return filteredGroups;
}
