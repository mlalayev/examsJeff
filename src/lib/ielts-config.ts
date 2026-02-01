/**
 * IELTS Exam Configuration
 * Fixed ordering and timer constraints for IELTS exams
 */

export const IELTS_SECTION_ORDER = {
  LISTENING: 0,
  READING: 1,
  WRITING: 2,
  SPEAKING: 3,
} as const;

export const IELTS_SECTION_LABELS = {
  LISTENING: "Listening",
  READING: "Reading",
  WRITING: "Writing",
  SPEAKING: "Speaking",
} as const;

export const IELTS_SECTION_DURATIONS = {
  LISTENING: 30, // minutes
  READING: 60,
  WRITING: 60,
  SPEAKING: 11, // default, configurable 11-14
} as const;

export const IELTS_SPEAKING_MIN_DURATION = 11;
export const IELTS_SPEAKING_MAX_DURATION = 14;

/**
 * IELTS Reading structure
 */
export const IELTS_READING_CONFIG = {
  TOTAL_QUESTIONS: 40,
  TOTAL_DURATION: 60, // minutes
  PASSAGES: [
    {
      id: 1,
      title: "Passage 1",
      questionRange: { start: 1, end: 13 },
      difficulty: "Easy",
    },
    {
      id: 2,
      title: "Passage 2",
      questionRange: { start: 14, end: 26 },
      difficulty: "Medium",
    },
    {
      id: 3,
      title: "Passage 3",
      questionRange: { start: 27, end: 40 },
      difficulty: "Hard",
    },
  ],
} as const;

/**
 * IELTS Writing structure
 */
export const IELTS_WRITING_CONFIG = {
  TOTAL_DURATION: 60, // minutes
  TASKS: [
    {
      id: 1,
      title: "Task 1",
      minWords: 150,
      suggestedTime: 20, // minutes
      academicType: "Report (graph/chart/diagram/process/map)",
      generalType: "Letter (formal/semi-formal/informal)",
    },
    {
      id: 2,
      title: "Task 2",
      minWords: 250,
      suggestedTime: 40, // minutes
      type: "Essay (both Academic & General)",
    },
  ],
} as const;

export type ReadingType = "ACADEMIC" | "GENERAL";
export type WritingType = "ACADEMIC" | "GENERAL";

export type IELTSSectionType = keyof typeof IELTS_SECTION_ORDER;

/**
 * Validate IELTS section uniqueness (LISTENING, READING, WRITING can only be added once)
 */
export function validateIELTSSectionUniqueness(
  sections: Array<{ type: string }>,
  newSectionType?: string
): { valid: boolean; error?: string } {
  const sectionCounts = {
    LISTENING: sections.filter(s => s.type === "LISTENING").length,
    READING: sections.filter(s => s.type === "READING").length,
    WRITING: sections.filter(s => s.type === "WRITING").length,
  };
  
  if (newSectionType === "LISTENING" && sectionCounts.LISTENING >= 1) {
    return {
      valid: false,
      error: "LISTENING section can only be added once per IELTS exam"
    };
  }
  
  if (newSectionType === "READING" && sectionCounts.READING >= 1) {
    return {
      valid: false,
      error: "READING section can only be added once per IELTS exam"
    };
  }
  
  if (newSectionType === "WRITING" && sectionCounts.WRITING >= 1) {
    return {
      valid: false,
      error: "WRITING section can only be added once per IELTS exam"
    };
  }
  
  return { valid: true };
}

// Backward compatibility alias
export const validateIELTSListeningUniqueness = validateIELTSSectionUniqueness;

/**
 * Sort IELTS sections in correct order
 */
export function sortIELTSSections<T extends { type: string; order?: number }>(
  sections: T[]
): T[] {
  return [...sections].sort((a, b) => {
    const orderA = IELTS_SECTION_ORDER[a.type as IELTSSectionType] ?? 999;
    const orderB = IELTS_SECTION_ORDER[b.type as IELTSSectionType] ?? 999;
    return orderA - orderB;
  });
}

/**
 * Get default duration for IELTS section
 */
export function getIELTSSectionDuration(sectionType: IELTSSectionType): number {
  return IELTS_SECTION_DURATIONS[sectionType];
}

/**
 * Check if a section type is valid for IELTS
 */
export function isValidIELTSSection(type: string): type is IELTSSectionType {
  return type in IELTS_SECTION_ORDER;
}



