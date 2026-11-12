import { classExamCategories } from './teacher-exam-scope';
import { computeAttemptPercentFromSections } from './attempt-score';

import { registerWeek, bakuDate } from './register-dates';
export { registerWeek } from './register-dates';
export function registerExamRows(className: string, studentId: string, attempts: any[], exams: Map<string, any>) {
  const allowed = classExamCategories(className);
  return attempts.filter(a => a.studentId === studentId && allowed.includes(exams.get(a.examId)?.category)).map(a => {
    const exam = exams.get(a.examId);
    const date = bakuDate(new Date(a.submittedAt));
    return { id: a.id, title: exam.title, category: exam.category, date, week: registerWeek(date), score: a.status === 'DISQUALIFIED' ? null : computeAttemptPercentFromSections(a.sections), invalid: a.status === 'DISQUALIFIED' };
  });
}
