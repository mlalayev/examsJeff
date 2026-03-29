import type { ExamCategory, Section } from "./types";

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: {
    title: string;
    message: string;
  };
}

/**
 * Validate exam basic info before saving
 */
export function validateExamInfo(
  category: ExamCategory | null,
  title: string,
  sections: Section[]
): ValidationResult {
  if (!category) {
    return {
      valid: false,
      error: {
        title: "Validation Error",
        message: "Please select an exam category",
      },
    };
  }

  if (!title.trim()) {
    return {
      valid: false,
      error: {
        title: "Validation Error",
        message: "Please enter an exam title",
      },
    };
  }

  if (sections.length === 0) {
    return {
      valid: false,
      error: {
        title: "Validation Error",
        message: "Please add at least one section",
      },
    };
  }

  return { valid: true };
}

/**
 * Validate FILL_IN_BLANK question text has [input] placeholders
 */
export function validateFillInBlankText(text: string): ValidationResult {
  const lines = text.split('\n').filter((line: string) => line.trim());
  
  if (lines.length === 0) {
    return {
      valid: false,
      error: {
        title: "Validation Error",
        message: "Please add at least one line with [input] placeholder",
      },
    };
  }

  const hasInputs = lines.some(line => /\[input\]/i.test(line));
  
  if (!hasInputs) {
    return {
      valid: false,
      error: {
        title: "Validation Error",
        message: "Please add at least one [input] placeholder",
      },
    };
  }

  return { valid: true };
}

/**
 * Check if a category allows section deletion
 */
export function canDeleteSection(category: ExamCategory): boolean {
  return category !== "IELTS";
}

/**
 * Check if a category allows section addition
 */
export function canAddSection(category: ExamCategory): boolean {
  return category !== "IELTS";
}
