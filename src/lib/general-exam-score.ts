import { scoreQuestion, scoreImageInteractiveQuestion } from './scoring';

export const GENERAL_MAX_POINTS = { GRAMMAR: 25, VOCABULARY: 25, LISTENING: 25, READING: 15, WRITING: 10 } as const;
type Section = { id: string; type: string; questions: Array<{ id: string; qtype: string; answerKey?: any; options?: any }> };
export function generalExamScore(sections: Section[], answers: Map<string, unknown>, writing: Array<{ questionId: string; score: number }> = []) {
  const breakdown = Object.entries(GENERAL_MAX_POINTS).map(([type, maximum]) => {
    const questions = sections.filter(s => s.type === type).flatMap(s => s.questions);
    let earned = 0, pending = false;
    for (const q of questions) {
      if (q.qtype === 'ESSAY') {
        const grade = writing.find(w => w.questionId === q.id);
        if (!grade) pending = true;
        else earned += Math.max(0, Math.min(100, grade.score)) / 100;
      } else {
        earned += q.qtype === 'IMAGE_INTERACTIVE'
          ? scoreImageInteractiveQuestion(answers.get(q.id), q.answerKey, q.options)
          : scoreQuestion(q.qtype as any, answers.get(q.id), q.answerKey);
      }
    }
    const points = pending ? null : Math.round((questions.length ? earned / questions.length : 0) * maximum * 100) / 100;
    return { type, maximum, questions: questions.length, earned, points, pending };
  });
  return { generalScoreVersion: 2, generalBreakdown: breakdown, generalOverall: breakdown.some(b => b.pending) ? null : Math.round(breakdown.reduce((sum, b) => sum + (b.points || 0), 0) * 100) / 100 };
}

export function generalAnswerMap(attempt: { answers?: unknown; sections: Array<{ answers?: unknown }> }, sections: Section[], normalized: Array<{ questionId: string; answer: unknown }>) {
  const map = new Map<string, unknown>();
  const legacy = attempt.answers as any;
  for (const section of sections) for (const q of section.questions) {
    map.set(q.id, legacy?.[section.id]?.[q.id] ?? attempt.sections.map(s => (s.answers as any)?.[q.id]).find(a => a !== undefined) ?? legacy?.[section.type]?.[q.id]);
  }
  for (const answer of normalized) map.set(answer.questionId, answer.answer);
  return map;
}
