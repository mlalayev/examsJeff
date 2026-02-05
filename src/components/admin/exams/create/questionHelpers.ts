import type { QuestionType } from "./types";

export const getDefaultPrompt = (qtype: QuestionType): any => {
  switch (qtype) {
    case "TF":
      return { text: "Enter the statement here" };
    case "TF_NG":
      return { text: "Enter the statement here" };
    case "MCQ_SINGLE":
    case "MCQ_MULTI":
      return { text: "Enter the question here" };
    case "INLINE_SELECT":
      return { text: "Enter the question here" };
    case "ORDER_SENTENCE":
      return { tokens: ["token1", "token2", "token3"] };
    case "DND_GAP":
      return { textWithBlanks: "Enter text with blanks (use ___ for blanks)" };
    case "SHORT_TEXT":
      return { text: "Enter the question here" };
    case "ESSAY":
      return { text: "Write an essay about..." };
    default:
      return { text: "" };
  }
};

export const getDefaultOptions = (qtype: QuestionType): any => {
  switch (qtype) {
    case "MCQ_SINGLE":
    case "MCQ_MULTI":
      return { choices: ["Option 1", "Option 2", "Option 3", "Option 4"] };
    case "INLINE_SELECT":
      return { choices: ["Option 1", "Option 2", "Option 3"] };
    case "DND_GAP":
      return { bank: [] };
    default:
      return undefined;
  }
};

export const getDefaultAnswerKey = (qtype: QuestionType): any => {
  switch (qtype) {
    case "TF":
      return { value: true };
    case "TF_NG":
      return { value: "TRUE" };
    case "MCQ_SINGLE":
    case "INLINE_SELECT":
      return { index: 0 };
    case "MCQ_MULTI":
      return { indices: [0, 1] };
    case "ORDER_SENTENCE":
      return { order: [] };
    case "DND_GAP":
      return { blanks: ["word1", "word2"] };
    case "SHORT_TEXT":
      return { answers: ["answer1"] };
    case "ESSAY":
      return null;
    default:
      return {};
  }
};

