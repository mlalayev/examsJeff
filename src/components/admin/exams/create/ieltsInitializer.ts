import type { Section } from "./types";
import { IELTS_SECTION_INSTRUCTIONS, IELTS_SECTION_DURATIONS } from "./constants";

/**
 * Creates the fixed 4-section structure for IELTS exams
 */
export function createIELTSSections(): Section[] {
  const baseTime = Date.now();
  
  return [
    {
      id: `section-${baseTime}-1`,
      type: "LISTENING",
      title: "Listening",
      instruction: IELTS_SECTION_INSTRUCTIONS.LISTENING,
      durationMin: IELTS_SECTION_DURATIONS.LISTENING,
      order: 0,
      questions: [],
    },
    {
      id: `section-${baseTime}-2`,
      type: "READING",
      title: "Reading",
      instruction: IELTS_SECTION_INSTRUCTIONS.READING,
      durationMin: IELTS_SECTION_DURATIONS.READING,
      order: 1,
      questions: [],
    },
    {
      id: `section-${baseTime}-3`,
      type: "WRITING",
      title: "Writing",
      instruction: IELTS_SECTION_INSTRUCTIONS.WRITING,
      durationMin: IELTS_SECTION_DURATIONS.WRITING,
      order: 2,
      questions: [],
    },
    {
      id: `section-${baseTime}-4`,
      type: "SPEAKING",
      title: "Speaking",
      instruction: IELTS_SECTION_INSTRUCTIONS.SPEAKING,
      durationMin: IELTS_SECTION_DURATIONS.SPEAKING,
      order: 3,
      questions: [],
    },
  ];
}
