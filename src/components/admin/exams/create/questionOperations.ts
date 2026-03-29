import type { Question, Section, ExamCategory } from "./types";
import { createQuestionDraft } from "./addQuestionFlow";

/**
 * Context for question operations
 */
export interface QuestionOperationContext {
  examCategory: ExamCategory;
  currentSection: Section;
  ieltsContext?: {
    getCurrentPart: () => number;
  };
}

/**
 * Result of processing FILL_IN_BLANK split
 */
export interface FillInBlankSplitResult {
  questions: Question[];
  valid: boolean;
  error?: {
    title: string;
    message: string;
  };
}

/**
 * Split FILL_IN_BLANK text into separate questions (one per line)
 */
export function splitFillInBlankQuestions(
  editingQuestion: Question,
  context: QuestionOperationContext
): FillInBlankSplitResult {
  const text = editingQuestion.prompt?.text || "";
  const lines = text.split('\n').filter((line: string) => line.trim());

  if (lines.length === 0) {
    return {
      questions: [],
      valid: false,
      error: {
        title: "Validation Error",
        message: "Please add at least one line with [input] placeholder",
      },
    };
  }

  const newQuestions: Question[] = [];
  let globalBlankIndex = 0;

  lines.forEach((line: string, lineIdx: number) => {
    const inputCount = (line.match(/\[input\]/gi) || []).length;

    if (inputCount === 0) return;

    const lineAnswers: string[] = [];
    for (let i = 0; i < inputCount; i++) {
      const answer = Array.isArray(editingQuestion.answerKey?.blanks)
        ? editingQuestion.answerKey.blanks[globalBlankIndex + i] || ""
        : "";
      lineAnswers.push(answer);
    }

    const baseQuestionResult = createQuestionDraft({
      questionType: "FILL_IN_BLANK",
      examCategory: context.examCategory,
      sectionType: context.currentSection.type,
      currentSection: context.currentSection,
      ieltsContext: context.ieltsContext,
    });

    const questionId = `${baseQuestionResult.question.id}-${lineIdx}`;

    const newQuestion: Question = {
      id: editingQuestion.id && lineIdx === 0 ? editingQuestion.id : questionId,
      qtype: "FILL_IN_BLANK",
      order: context.currentSection.questions.length + newQuestions.length,
      prompt: {
        text: line.trim(),
        instructions: lineIdx === 0 ? editingQuestion.prompt?.instructions : undefined,
        title: lineIdx === 0 ? editingQuestion.prompt?.title : undefined,
      },
      answerKey: { blanks: lineAnswers },
      maxScore: inputCount,
      image: lineIdx === 0 ? editingQuestion.image : undefined,
    };

    newQuestions.push(newQuestion);
    globalBlankIndex += inputCount;
  });

  if (newQuestions.length === 0) {
    return {
      questions: [],
      valid: false,
      error: {
        title: "Validation Error",
        message: "Please add at least one [input] placeholder",
      },
    };
  }

  return {
    questions: newQuestions,
    valid: true,
  };
}

/**
 * Update questions list with new/edited question(s)
 */
export function updateQuestionsInSection(
  currentQuestions: Question[],
  editingQuestion: Question,
  newQuestions: Question[]
): Question[] {
  const existingIndex = currentQuestions.findIndex(
    (q) => q.id === editingQuestion.id
  );

  let updatedQuestions = [...currentQuestions];

  if (existingIndex !== -1) {
    updatedQuestions.splice(existingIndex, 1, ...newQuestions);
  } else {
    updatedQuestions = [...updatedQuestions, ...newQuestions];
  }

  return updatedQuestions.map((q, idx) => ({ ...q, order: idx }));
}

/**
 * Delete a question from section
 */
export function deleteQuestionFromSection(
  currentQuestions: Question[],
  questionId: string
): Question[] {
  const filtered = currentQuestions.filter((q) => q.id !== questionId);
  return filtered.map((q, idx) => ({ ...q, order: idx }));
}
