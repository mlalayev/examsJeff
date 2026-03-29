import type { Question, QuestionType, ExamCategory, SectionType, Section } from "./types";
import { getDefaultPrompt, getDefaultOptions, getDefaultAnswerKey } from "./questionHelpers";
import { isQuestionTypeAllowed, type QuestionTypeContext } from "./questionTypeRules";
import { generateQuestionIdWithBehavior, applyCategoryAdjustments, type CategoryContext } from "./categoryBehaviors";

/**
 * Input for adding a question
 */
export interface AddQuestionInput {
  questionType: QuestionType;
  examCategory: ExamCategory;
  sectionType: SectionType;
  currentSection: Section;
  ieltsContext?: {
    getCurrentPart: () => number;
  };
}

/**
 * Result of adding a question
 */
export interface AddQuestionResult {
  question: Question;
  valid: boolean;
  error?: string;
}

/**
 * Shared add question flow - single pipeline for all categories
 * 
 * Steps:
 * 1. Validate question type is allowed
 * 2. Generate question ID (with category adjustments)
 * 3. Get defaults from factories
 * 4. Apply category-specific adjustments
 * 5. Return question ready for editing
 */
export function createQuestionDraft(input: AddQuestionInput): AddQuestionResult {
  const { questionType, examCategory, sectionType, currentSection, ieltsContext } = input;

  // 1. Validate type is allowed
  const context: QuestionTypeContext = {
    examCategory,
    sectionType,
    ieltsContext: ieltsContext ? { part: ieltsContext.getCurrentPart() } : undefined,
  };

  if (!isQuestionTypeAllowed(context, questionType)) {
    return {
      question: null as any,
      valid: false,
      error: `Question type ${questionType} is not allowed for ${examCategory} ${sectionType} section`,
    };
  }

  // 2. Get defaults from factories
  const defaultPrompt = getDefaultPrompt(questionType);
  
  // Special handling for ORDER_SENTENCE: add rawText for display
  if (questionType === "ORDER_SENTENCE" && Array.isArray(defaultPrompt.tokens)) {
    defaultPrompt.rawText = defaultPrompt.tokens.join("\n");
  }

  // 3. Generate ID with category behavior
  const categoryContext: CategoryContext = {
    examCategory,
    sectionType,
    currentSection,
    ieltsContext,
  };

  const questionId = generateQuestionIdWithBehavior(categoryContext);

  // 4. Create base question
  let question: Question = {
    id: questionId,
    qtype: questionType,
    order: currentSection.questions.length,
    prompt: defaultPrompt,
    options: getDefaultOptions(questionType),
    answerKey: getDefaultAnswerKey(questionType),
    maxScore: 1,
  };

  // 5. Apply category-specific adjustments
  question = applyCategoryAdjustments(question, categoryContext);

  return {
    question,
    valid: true,
  };
}
