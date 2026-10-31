import type { ExamCategory, QuestionType, Section, SectionType } from '@/components/admin/exams/create/types';
import { parseGeneralText, type GeneralImportResult } from './general-text-import';
import { importModules, parseSatText } from './sat-text-import';

export function parseHomeworkText(text: string, category: ExamCategory, types?: QuestionType[], allowedSections?: SectionType[]): GeneralImportResult {
  let result: GeneralImportResult;
  if (category === 'SAT' || category === 'MATH') {
    const parsed = parseSatText(text, {}, category, true);
    const names = importModules(category);
    const sections = parsed.modules.flatMap((questions, i): Section[] => {
      if (!questions.length) return [];
      const verbal = names[i].startsWith('verbal');
      return [{ id: names[i], title: names[i].replace(/\b\w/g, c => c.toUpperCase()), type: verbal ? 'READING' : 'GRAMMAR',
        order: i, durationMin: verbal ? 32 : 35, instruction: '', questions }];
    });
    result = { sections, errors: parsed.errors, warnings: [] };
  } else {
    result = parseGeneralText(text, types, allowedSections);
  }
  for (const section of result.sections) {
    section.questions.forEach((question, index) => {
      if (!question.explanation?.trim()) result.errors.push(`${section.title}, question ${index + 1}: add Explanation: with a reason or worked solution.`);
    });
  }
  return result;
}
