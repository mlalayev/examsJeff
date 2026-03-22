/**
 * Build Task 1 / Task 2 essay strings from exam structure + attempt answers
 * (same rules as GET /api/attempts/:id/results for WRITING)
 */
export function getWritingTaskTextsFromAttempt(attempt: any, examWithSections: any): {
  task1: string;
  task2: string;
} {
  const parentSections = examWithSections.sections.filter((s: any) => !s.parentSectionId);
  const subsectionsByParent = examWithSections.sections
    .filter((s: any) => s.parentSectionId)
    .reduce((acc: any, sub: any) => {
      if (!acc[sub.parentSectionId]) acc[sub.parentSectionId] = [];
      acc[sub.parentSectionId].push(sub);
      return acc;
    }, {});

  const examSection = parentSections.find((s: any) => s.type === "WRITING");
  if (!examSection) {
    return { task1: "", task2: "" };
  }

  const attemptSection = attempt.sections.find((as: any) => as.type === "WRITING");
  const allStudentAnswers = (attempt.answers as any) || {};

  let allQuestions = [...(examSection.questions || [])];
  const sectionSubsections = subsectionsByParent[examSection.id] || [];
  sectionSubsections.forEach((sub: any) => {
    allQuestions = [...allQuestions, ...(sub.questions || [])];
  });

  let studentAnswers: Record<string, any> = {};
  if (attemptSection?.answers) {
    studentAnswers = { ...(attemptSection.answers as Record<string, any>) };
  } else {
    studentAnswers = { ...(allStudentAnswers[examSection.type] || {}) };
    sectionSubsections.forEach((sub: any) => {
      const subAnswers = allStudentAnswers[sub.type] || {};
      studentAnswers = { ...studentAnswers, ...subAnswers };
    });
  }

  allQuestions.sort((a: any, b: any) => a.order - b.order);

  const q1 = allQuestions[0];
  const q2 = allQuestions[1];
  const task1 = q1 ? normalizeAnswer(studentAnswers[q1.id]) : "";
  const task2 = q2 ? normalizeAnswer(studentAnswers[q2.id]) : "";

  return { task1, task2 };
}

function normalizeAnswer(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  return String(val);
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
}
