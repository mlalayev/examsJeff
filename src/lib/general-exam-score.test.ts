import { generalExamScore, generalAnswerMap } from './general-exam-score';
import { computeAttemptPercentFromSections } from './attempt-score';
const q = (id: string) => ({ id, qtype: 'SHORT_TEXT', answerKey: { answers: ['2'] } });
const section = (type: string, ids: string[]) => ({ id: `${type}-${ids[0]}`, type, questions: ids.map(q) });
test('fixed categories total 100 with numeric answers and an independently graded speaking section', () => {
  const sections = [section('GRAMMAR', ['g']), section('VOCABULARY', ['v']), section('READING', ['r']), section('LISTENING', ['l']),
    { id: 'w', type: 'WRITING', questions: [{ id: 'essay', qtype: 'ESSAY' }] }, section('SPEAKING', ['s'])];
  const result = generalExamScore(sections, new Map(['g', 'v', 'r', 'l'].map(id => [id, 2])), [{ questionId: 'essay', score: 100 }]);
  expect(result.generalOverall).toBe(100);
  expect(result.generalBreakdown.map(b => b.points)).toEqual([25, 25, 25, 15, 10]);
  expect(computeAttemptPercentFromSections([{ type: 'WRITING', rawScore: null, maxScore: 1, rubric: { ...result, generalWritingStatus: 'COMPLETED' } }, { type: 'SPEAKING', rawScore: 0, maxScore: 100 }])).toBe(100);
});
test('unequal listening sections are pooled by question count, not averaged or awarded 25 each', () => {
  const result = generalExamScore([section('LISTENING', ['a']), section('LISTENING', ['b', 'c', 'd'])], new Map([['a', '2']]));
  expect(result.generalOverall).toBe(6.25);
  expect(result.generalBreakdown.find(b => b.type === 'LISTENING')).toMatchObject({ questions: 4, points: 6.25, maximum: 25 });
});
test('writing stays pending until graded and missing categories never inflate the score', () => {
  const sections = [{ id: 'w', type: 'WRITING', questions: [{ id: 'essay', qtype: 'ESSAY' }] }];
  expect(generalExamScore(sections, new Map()).generalOverall).toBeNull();
  expect(generalExamScore(sections, new Map(), [{ questionId: 'essay', score: 80 }]).generalOverall).toBe(8);
});
test('legacy answers from repeated sections are retained and normalized answers take precedence', () => {
  const sections = [section('LISTENING', ['a']), section('LISTENING', ['b'])];
  const answers = generalAnswerMap({ answers: { 'LISTENING-a': { a: 'old' } }, sections: [{ answers: { b: 2 } }] }, sections, [{ questionId: 'a', answer: 2 }]);
  expect(generalExamScore(sections, answers).generalOverall).toBe(25);
});
