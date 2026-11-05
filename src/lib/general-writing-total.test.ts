import { combineGeneralWriting } from './general-writing-total';
import { computeAttemptPercentFromSections } from './attempt-score';
test('writing changes overall by 20 percent and averages multiple essays', () => {
  expect(combineGeneralWriting(30, 40, [100])).toBe(80);
  expect(combineGeneralWriting(30, 40, [0])).toBe(60);
  expect(combineGeneralWriting(30, 40, [60, 100])).toBe(76);
});
test('writing-only tests use full writing score and objective-only tests retain theirs', () => {
  expect(combineGeneralWriting(0, 0, [70])).toBe(70);
  expect(combineGeneralWriting(30, 40, [])).toBe(75);
});
test('history and rewards use final overall or remain pending', () => {
  const section = { type: 'WRITING', rawScore: null, maxScore: 1 };
  expect(computeAttemptPercentFromSections([{ ...section, rubric: { generalWritingStatus: 'PENDING' } }])).toBeNull();
  expect(computeAttemptPercentFromSections([{ ...section, rubric: { generalWritingStatus: 'COMPLETED', generalOverall: 76 } }])).toBe(76);
});
