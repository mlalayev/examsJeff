import type { ExamCategory, SectionType, Question } from "./types";

/**
 * Context for category-specific adjustments
 */
export interface CategoryContext {
  examCategory: ExamCategory;
  sectionType: SectionType;
  currentSection: {
    id: string;
    type: SectionType;
    questions: Question[];
  };
  ieltsContext?: {
    getCurrentPart: () => number;
  };
}

/**
 * Category-specific behavior for question creation
 */
export interface CategoryBehavior {
  /**
   * Adjust question ID based on category rules (e.g., IELTS part prefixes)
   */
  adjustQuestionId?: (baseId: string, context: CategoryContext, suffix?: string) => string;
  
  /**
   * Any post-creation adjustments to the question object
   */
  adjustQuestion?: (question: Question, context: CategoryContext) => Question;
}

/**
 * IELTS-specific behavior
 */
const ieltsBehavior: CategoryBehavior = {
  adjustQuestionId: (baseId, context, suffix) => {
    if (!context.ieltsContext) return baseId;
    
    const part = context.ieltsContext.getCurrentPart();
    const timestamp = Date.now();
    const suffixStr = suffix ? `-${suffix}` : '';
    
    if (context.sectionType === "WRITING") {
      return `q-task${part}-${timestamp}${suffixStr}`;
    }
    return `q-part${part}-${timestamp}${suffixStr}`;
  },
};

/**
 * Registry of category-specific behaviors
 */
const CATEGORY_BEHAVIORS: Partial<Record<ExamCategory, CategoryBehavior>> = {
  IELTS: ieltsBehavior,
};

/**
 * Get category-specific behavior, or default (empty) behavior
 */
export function getCategoryBehavior(category: ExamCategory): CategoryBehavior {
  return CATEGORY_BEHAVIORS[category] || {};
}

/**
 * Generate question ID with category-specific adjustments
 */
export function generateQuestionIdWithBehavior(
  context: CategoryContext,
  suffix?: string
): string {
  const behavior = getCategoryBehavior(context.examCategory);
  const baseId = `q-${Date.now()}${suffix ? `-${suffix}` : ''}`;
  
  if (behavior.adjustQuestionId) {
    return behavior.adjustQuestionId(baseId, context, suffix);
  }
  
  return baseId;
}

/**
 * Apply category-specific adjustments to a question
 */
export function applyCategoryAdjustments(
  question: Question,
  context: CategoryContext
): Question {
  const behavior = getCategoryBehavior(context.examCategory);
  
  if (behavior.adjustQuestion) {
    return behavior.adjustQuestion(question, context);
  }
  
  return question;
}
