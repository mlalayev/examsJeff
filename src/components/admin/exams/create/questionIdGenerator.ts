import type { ExamCategory, SectionType } from "./types";
import { generateIELTSQuestionId } from "./ieltsHelpers";

/**
 * Generate a question ID based on exam category and context
 */
export function generateQuestionId(
  examCategory: ExamCategory,
  sectionType: SectionType,
  currentPart?: number,
  suffix?: string
): string {
  if (examCategory === "IELTS" && currentPart) {
    return generateIELTSQuestionId(sectionType, currentPart, suffix);
  }
  
  const timestamp = Date.now();
  const baseSuffix = suffix ? `-${suffix}` : '';
  return `q-${timestamp}${baseSuffix}`;
}
