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
    case "FILL_IN_BLANK":
      return { 
        text: "Enter text with [input] placeholders. Example: My name is [input] and I am [input] years old.",
        instructions: "Fill in the blanks with appropriate words"
      };
    case "SPEAKING_RECORDING":
      return { 
        text: "Enter the speaking question here",
        part: 1 // Part 1, 2, or 3
      };
    case "IMAGE_INTERACTIVE":
      return {
        text: "Click on the correct area(s) in the image",
        backgroundImage: "",
        interactionType: "single" // "single" or "multiple"
      };
    case "HTML_CSS":
      return {
        text: "Create HTML/CSS code according to the requirements",
        htmlCode: "<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>",
        cssCode: "body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n}\n\nh1 {\n  color: #333;\n}"
      };
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
    case "IMAGE_INTERACTIVE":
      return { 
        hotspots: [] // Array of { id, x, y, width, height, label, isCorrect }
      };
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
    case "FILL_IN_BLANK":
      return { blanks: ["answer1", "answer2"] }; // Array of correct answers for each blank
    case "SPEAKING_RECORDING":
      return null; // No answer key for speaking (manual grading)
    case "IMAGE_INTERACTIVE":
      return { correctHotspotIds: [] }; // Array of correct hotspot IDs
    case "HTML_CSS":
      return {}; // Answers are read directly from HTML attributes, no separate answerKey needed
    default:
      return {};
  }
};

