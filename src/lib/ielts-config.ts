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

export type IELTSSectionType = keyof typeof IELTS_SECTION_ORDER;

/**
 * Validate IELTS section uniqueness (LISTENING can only be added once)
 */
export function validateIELTSListeningUniqueness(
  sections: Array<{ type: string }>,
  newSectionType?: string
): { valid: boolean; error?: string } {
  const listeningCount = sections.filter(s => s.type === "LISTENING").length;
  
  if (newSectionType === "LISTENING" && listeningCount >= 1) {
    return {
      valid: false,
      error: "LISTENING section can only be added once per IELTS exam"
    };
  }
  
  return { valid: true };
}

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


