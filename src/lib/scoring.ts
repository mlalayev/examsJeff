/**
 * Auto-scoring utility for exam questions
 */

import { QuestionType } from "@prisma/client";
import { extractHtmlCssAnswerKeyV1, type HtmlCssAnswerKeyV1 } from "@/lib/htmlCssAnswerKey";

import { textAnswersMatch } from '@/lib/answer-text';

/**
 * Auto-scoring function for question types
 * Returns 1 for correct, 0 for incorrect
 * 
 * Scoring rules:
 * - TF: exact boolean match
 * - MCQ_SINGLE: selected index === answerKey.index
 * - MCQ_MULTI: set(indices) === set(answerKey.indices)
 * - SELECT: selected === answerKey.index
 * - SHORT_TEXT: normalize(trim, lower); any-of answerKey.answers
 * - ORDER_SENTENCE: order array deep-equal
 * - DND_GAP: each blank filled === answerKey.blanks[i] (normalize lower-trim)
 * - ESSAY: no autoscore (returns 0)
 */
export function scoreQuestion(qtype: QuestionType, studentAnswer: any, answerKey: any): number {
  switch (qtype) {
    case "TF": {
      const correctBool = answerKey?.value;
      const studentBool = (() => {
        if (typeof studentAnswer === "boolean") return studentAnswer;
        if (typeof studentAnswer === "number") {
          if (studentAnswer === 0) return true;
          if (studentAnswer === 1) return false;
        }
        if (typeof studentAnswer === "string") {
          const upper = studentAnswer.trim().toUpperCase();
          if (upper === "TRUE") return true;
          if (upper === "FALSE") return false;
        }
        return null;
      })();
      return studentBool === correctBool ? 1 : 0;
    }
    case "TF_NG": {
      if (!studentAnswer || !answerKey?.value) return 0;
      const normalize = (v: any) =>
        typeof v === "string" ? v.trim().toUpperCase() : String(v).trim().toUpperCase();
      return normalize(studentAnswer) === normalize(answerKey.value) ? 1 : 0;
    }
    case "MCQ_SINGLE": {
      // Selected index === answerKey.index
      const correctIdx = answerKey?.index;
      return studentAnswer === correctIdx ? 1 : 0;
    }
    case "MCQ_MULTI": {
      // Set equality: set(indices) === set(answerKey.indices)
      const correctIndices = answerKey?.indices || [];
      if (!Array.isArray(studentAnswer)) return 0;
      const sorted = [...studentAnswer].sort((a, b) => a - b);
      const correctSorted = [...correctIndices].sort((a, b) => a - b);
      if (sorted.length !== correctSorted.length) return 0;
      return sorted.every((v, i) => v === correctSorted[i]) ? 1 : 0;
    }
    case "SELECT":
    case "INLINE_SELECT": {
      // Multi-blank: { "0": idx, "1": idx } vs answerKey.indices
      if (
        studentAnswer &&
        typeof studentAnswer === "object" &&
        !Array.isArray(studentAnswer)
      ) {
        const correctIndices = answerKey?.indices;
        if (!Array.isArray(correctIndices) || correctIndices.length === 0) return 0;
        for (let i = 0; i < correctIndices.length; i++) {
          const studentIdx = (studentAnswer as Record<string, number>)[String(i)];
          if (studentIdx !== correctIndices[i]) return 0;
        }
        return 1;
      }
      const correctIdx = answerKey?.index;
      return studentAnswer === correctIdx ? 1 : 0;
    }
    case "GAP": // Legacy support - same as SHORT_TEXT
    case "SHORT_TEXT": {
      const acceptedAnswers = answerKey?.answers;
      if (!Array.isArray(acceptedAnswers)) return 0;
      const value = studentAnswer && typeof studentAnswer === 'object' && !Array.isArray(studentAnswer)
        ? studentAnswer['0'] : studentAnswer;
      return acceptedAnswers.some((answer: unknown) => textAnswersMatch(value, answer)) ? 1 : 0;
    }
    case "FILL_IN_BLANK": {
      const blanks = Array.isArray(answerKey) ? answerKey : answerKey?.blanks;
      if (!Array.isArray(blanks) || !blanks.length || !studentAnswer || typeof studentAnswer !== 'object') return 0;
      return blanks.every((expected: unknown, i: number) =>
        textAnswersMatch(studentAnswer[String(i)], expected)
      ) ? 1 : 0;
    }
    case "ORDER_SENTENCE": {
      // Order array deep-equal
      const correctOrder = answerKey?.order || [];
      if (!Array.isArray(studentAnswer)) return 0;
      if (studentAnswer.length !== correctOrder.length) return 0;
      return studentAnswer.every((v, i) => v === correctOrder[i]) ? 1 : 0;
    }
    case "DND_GAP": {
      // Value format: { "0": ["on", "at"], "1": ["in"] } (sentence index → array of answers for each blank)
      // answerKey format: { blanks: ["on", "at", "in"] } (flat array of all correct answers in order)
      const correctBlanks = answerKey?.blanks || [];
      if (!studentAnswer || typeof studentAnswer !== "object") return 0;
      
      // Flatten student answers: { "0": ["on", "at"], "1": ["in"] } → ["on", "at", "in"]
      const studentAnswersFlat: string[] = [];
      const sentenceIndices = Object.keys(studentAnswer).sort((a, b) => parseInt(a) - parseInt(b));
      
      for (const sentenceIdx of sentenceIndices) {
        const sentenceAnswers = studentAnswer[sentenceIdx];
        if (Array.isArray(sentenceAnswers)) {
          for (const answer of sentenceAnswers) {
            if (answer !== undefined && answer !== null) {
              studentAnswersFlat.push(answer);
            } else {
              studentAnswersFlat.push(""); // Missing blank
            }
          }
        }
      }
      
      if (!correctBlanks.length || studentAnswersFlat.length !== correctBlanks.length) return 0;
      
      // Check each blank answer
      return studentAnswersFlat.every((v, i) => {
        return textAnswersMatch(v, correctBlanks[i]);
      }) ? 1 : 0;
    }
    case "IMAGE_INTERACTIVE": {
      // New format supports multiple element types:
      // - Clickable elements (hotspots, radio buttons, checkboxes)
      // - Text input elements
      
      // Student answer format:
      // {
      //   selectedElementIds?: string[],        // For hotspots
      //   selectedHotspotIds?: string[],        // Backward compatibility
      //   inputValues?: { [elementId]: string }, // For text inputs
      //   radioSelections?: { [groupName]: elementId }, // For radio buttons
      //   checkboxSelections?: string[]         // For checkboxes
      // }
      
      // Answer key format:
      // {
      //   correctElementIds?: string[],   // Correct clickable element IDs
      //   correctHotspotIds?: string[],   // Backward compatibility
      // }
      
      if (!studentAnswer || typeof studentAnswer !== "object") return 0;
      if (!answerKey || typeof answerKey !== "object") return 0;
      
      let totalCorrect = 0;
      let totalQuestions = 0;
      
      // 1. Check clickable elements (hotspots, radio buttons, checkboxes)
const correctIds = answerKey.correctElementIds || answerKey.correctHotspotIds || [];
      
      if (correctIds.length > 0) {
        totalQuestions++;
        
        // Collect all selected element IDs from different sources
        const allSelectedIds: string[] = [];
        
        // From selectedElementIds or selectedHotspotIds (backward compatibility)
        const selectedElements = studentAnswer.selectedElementIds || studentAnswer.selectedHotspotIds || [];
        allSelectedIds.push(...selectedElements);
        
        // From radio selections (groupName -> elementId)
        if (studentAnswer.radioSelections) {
          const radioIds = Object.values(studentAnswer.radioSelections).filter(id => typeof id === "string");
          allSelectedIds.push(...radioIds);
        }
        
        // From checkbox selections
        if (studentAnswer.checkboxSelections && Array.isArray(studentAnswer.checkboxSelections)) {
          allSelectedIds.push(...studentAnswer.checkboxSelections);
        }
        
        // Check if selected IDs match correct IDs (order doesn't matter)
        const sortedSelected = [...new Set(allSelectedIds)].sort();
        const sortedCorrect = [...correctIds].sort();
        
        if (sortedSelected.length === sortedCorrect.length && 
            sortedSelected.every((id, i) => id === sortedCorrect[i])) {
          totalCorrect++;
        }
      }
      
      // 2. Check text input elements
      // Need to get the question's elements to validate input answers
      // This requires access to question.options.elements
      // For now, we'll need to pass the full question to scoreQuestion
      // or handle this in the submission endpoint
      
      // If there are no questions to check, return 0
      if (totalQuestions === 0) return 0;
      
      // Return 1 if all parts are correct, 0 otherwise
      return totalCorrect === totalQuestions ? 1 : 0;
    }
    
    case "HTML_CSS": {
      // HTML/CSS questions: compare studentAnswer (object keyed by field name)
      // against answerKey extracted from prompt.htmlCode.
      // We store extracted keys into question.answerKey (mode: HTML_ATTRS_V1).
      if (!studentAnswer || typeof studentAnswer !== "object") return 0;
      if (!answerKey || typeof answerKey !== "object") return 0;

      const key = answerKey as HtmlCssAnswerKeyV1;
      if (key.mode !== "HTML_ATTRS_V1" || !key.fields) return 0;

      const fields = key.fields;
      const fieldNames = Object.keys(fields);
      if (fieldNames.length === 0) return 0;

      for (const name of fieldNames) {
        const spec = fields[name];
        const studentVal = studentAnswer[name];

        if (spec.type === "checkbox") {
          const expected = (spec.accepted[0] || "false").toLowerCase() === "true";
          const got =
            studentVal === true ||
            studentVal === "true" ||
            studentVal === 1 ||
            studentVal === "1";
          if (got !== expected) return 0;
          continue;
        }

        const gotStr = studentVal == null ? "" : String(studentVal);
        if (!gotStr) return 0;

        const ok = (spec.accepted || []).some((a) => textAnswersMatch(gotStr, a));
        if (!ok) return 0;
      }

      return 1;
    }
    
    // Essay requires manual grading (no autoscore)
    case "ESSAY":
    default:
      return 0;
  }
}

/**
 * Calculate section score from individual question results
 * 
 * @param questions - Array of questions with their scores
 * @returns Object with rawScore and maxScore
 */
export function calculateSectionScore(questions: Array<{ maxScore: number; isCorrect: boolean }>) {
  let rawScore = 0;
  let maxScore = 0;

  for (const q of questions) {
    const score = q.maxScore || 1;
    maxScore += score;
    if (q.isCorrect) {
      rawScore += score;
    }
  }

  return { rawScore, maxScore };
}

/**
 * Calculate percentage score
 */
export function calculatePercentage(raw: number, max: number): number | null {
  if (max === 0) return null;
  return Math.round((raw / max) * 100);
}

/**
 * Score IMAGE_INTERACTIVE question with access to full question data
 * This allows validation of text input elements
 */
export function scoreImageInteractiveQuestion(
  studentAnswer: any,
  answerKey: any,
  questionOptions: any
): number {
  if (!studentAnswer || typeof studentAnswer !== "object") return 0;
  if (!answerKey || typeof answerKey !== "object") return 0;
  
  let totalCorrect = 0;
  let totalElements = 0;
  
  // Get elements from question options (supports both new and old format)
  const elements = questionOptions?.elements || questionOptions?.hotspots || [];
  
  // 1. Check clickable elements (hotspots, radio buttons, checkboxes)
  const clickableElements = elements.filter((e: any) => 
    !e.type || e.type === "hotspot" || e.type === "radio" || e.type === "checkbox"
  );
  
  if (clickableElements.length > 0) {
    const correctIds = answerKey.correctElementIds || answerKey.correctHotspotIds || [];
    
    if (correctIds.length > 0) {
      totalElements++;
      
      // Collect all selected element IDs from different sources
      const allSelectedIds: string[] = [];
      
      // From selectedElementIds or selectedHotspotIds (backward compatibility)
      const selectedElements = studentAnswer.selectedElementIds || studentAnswer.selectedHotspotIds || [];
      allSelectedIds.push(...selectedElements);
      
      // From radio selections (groupName -> elementId)
      if (studentAnswer.radioSelections) {
        const radioIds = Object.values(studentAnswer.radioSelections).filter(id => typeof id === "string");
        allSelectedIds.push(...radioIds);
      }
      
      // From checkbox selections
      if (studentAnswer.checkboxSelections && Array.isArray(studentAnswer.checkboxSelections)) {
        allSelectedIds.push(...studentAnswer.checkboxSelections);
      }
      
      // Check if selected IDs match correct IDs (order doesn't matter)
      const sortedSelected = [...new Set(allSelectedIds)].sort();
      const sortedCorrect = [...correctIds].sort();
      
      if (sortedSelected.length === sortedCorrect.length && 
          sortedSelected.every((id, i) => id === sortedCorrect[i])) {
        totalCorrect++;
      }
    }
  }
  
  // 2. Check text input elements
  const inputElements = elements.filter((e: any) => e.type === "input");
  
  for (const element of inputElements) {
    if (element.correctAnswer === null || element.correctAnswer === undefined || element.correctAnswer === '') continue; // Skip inputs without correct answers
    
    totalElements++;
    const studentInput = studentAnswer.inputValues?.[element.id] ?? "";
    
    // Case-insensitive comparison with normalization
    if (textAnswersMatch(studentInput, element.correctAnswer)) {
      totalCorrect++;
    }
  }
  
  // If there are no elements to check, return 0
  if (totalElements === 0) return 0;
  
  // Return 1 if all elements are correct, 0 otherwise
  // For partial credit, you could return totalCorrect / totalElements
  return totalCorrect === totalElements ? 1 : 0;
}
