import type { Section, SectionType, ExamCategory } from "./types";

/**
 * Create a new section
 */
export function createNewSection(
  type: SectionType,
  category: ExamCategory,
  existingSections: Section[]
): Section {
  const sectionId = `section-${Date.now()}`;
  
  let defaultDuration = 20;
  if (category === "SAT") {
    defaultDuration = type === "WRITING" ? 35 : 32;
  }

  return {
    id: sectionId,
    type,
    title: "",
    instruction: "",
    durationMin: defaultDuration,
    order: existingSections.length,
    questions: [],
  };
}

/**
 * Delete a section from sections list
 */
export function deleteSectionFromList(
  sections: Section[],
  sectionId: string
): Section[] {
  const filtered = sections.filter((s) => s.id !== sectionId);
  return filtered.map((s, idx) => ({ ...s, order: idx }));
}

/**
 * Update a section in sections list
 */
export function updateSectionInList(
  sections: Section[],
  updatedSection: Section
): Section[] {
  return sections.map((s) => (s.id === updatedSection.id ? updatedSection : s));
}
