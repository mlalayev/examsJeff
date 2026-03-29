import { useState } from "react";
import type { SectionType, Question } from "./types";

export interface IELTSPartState {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
}

/**
 * Hook for managing IELTS part selection state
 * Returns current parts and setters for each section type
 */
export function useIELTSParts() {
  const [listening, setListening] = useState(1);
  const [reading, setReading] = useState(1);
  const [writing, setWriting] = useState(1);
  const [speaking, setSpeaking] = useState(1);

  const resetParts = () => {
    setListening(1);
    setReading(1);
    setWriting(1);
    setSpeaking(1);
  };

  const getPartForSection = (sectionType: SectionType): number => {
    switch (sectionType) {
      case "LISTENING": return listening;
      case "READING": return reading;
      case "WRITING": return writing;
      case "SPEAKING": return speaking;
      default: return 1;
    }
  };

  const setPartForSection = (sectionType: SectionType, part: number) => {
    switch (sectionType) {
      case "LISTENING": setListening(part); break;
      case "READING": setReading(part); break;
      case "WRITING": setWriting(part); break;
      case "SPEAKING": setSpeaking(part); break;
    }
  };

  return {
    parts: { listening, reading, writing, speaking },
    setListening,
    setReading,
    setWriting,
    setSpeaking,
    resetParts,
    getPartForSection,
    setPartForSection,
  };
}

/**
 * Generate IELTS question ID with part prefix
 */
export function generateIELTSQuestionId(
  sectionType: SectionType,
  partNumber: number,
  suffix?: string
): string {
  const timestamp = Date.now();
  const baseSuffix = suffix ? `-${suffix}` : '';
  
  if (sectionType === "WRITING") {
    return `q-task${partNumber}-${timestamp}${baseSuffix}`;
  }
  return `q-part${partNumber}-${timestamp}${baseSuffix}`;
}

/**
 * Filter questions by IELTS part
 */
export function filterQuestionsByPart(
  questions: Question[],
  sectionType: SectionType,
  partNumber: number
): Question[] {
  const partIdentifier = sectionType === "WRITING" 
    ? `task${partNumber}`
    : `part${partNumber}`;
  
  return questions.filter(q => q.id.includes(partIdentifier));
}

/**
 * Get IELTS part label for display
 */
export function getIELTSPartLabel(
  sectionType: SectionType,
  partNumber: number
): string {
  switch (sectionType) {
    case "LISTENING":
      return `Part ${partNumber}`;
    case "READING":
      return `Passage ${partNumber}`;
    case "WRITING":
      return `Task ${partNumber}`;
    case "SPEAKING":
      return `Part ${partNumber}`;
    default:
      return `Part ${partNumber}`;
  }
}

/**
 * Calculate global question number across all IELTS parts
 */
export function calculateIELTSGlobalQuestionNumber(
  questions: Question[],
  sectionType: SectionType,
  currentPart: number,
  indexInCurrentPart: number
): number {
  let previousQuestionsCount = 0;
  
  const partIdentifier = sectionType === "WRITING" ? "task" : "part";
  
  for (let i = 1; i < currentPart; i++) {
    previousQuestionsCount += questions.filter(q => 
      q.id.includes(`${partIdentifier}${i}`)
    ).length;
  }
  
  return previousQuestionsCount + indexInCurrentPart + 1;
}
