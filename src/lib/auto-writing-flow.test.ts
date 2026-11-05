jest.mock('@/lib/prisma', () => ({ prisma: {
  attempt: { findUnique: jest.fn(), update: jest.fn() }, exam: { findUnique: jest.fn() },
  attemptAnswer: { findMany: jest.fn() }, attemptSection: { findUnique: jest.fn(), update: jest.fn() },
  $transaction: jest.fn(), $queryRaw: jest.fn(),
} }));
jest.mock('@/lib/auth-utils', () => ({ requireStudent: async () => ({ id: 'student' }) }));
jest.mock('@/lib/exam-integrity', () => ({ integrityBlock: async () => null }));
jest.mock('@/lib/coins', () => ({ tryAwardExamScoreReward: jest.fn() }));
jest.mock('@/lib/general-writing-ai', () => ({ ...jest.requireActual('./general-writing-ai'), scoreGeneralWriting: jest.fn(async () => ({ score: 80, feedback: 'Good work' })) }));
import { prisma } from './prisma';
import { loadAttemptPercent } from './attempt-score';
import { scoreGeneralWriting } from './general-writing-ai';
import { POST } from '@/app/api/attempts/[attemptId]/submit/route';

test('student submit runs actual grading service and saves overall used by history', async () => {
  const db = prisma as any;
  const sections = [{ id: 'w', type: 'WRITING', answers: {}, rawScore: null, maxScore: 1, rubric: {} }];
  const attempt = { id: 'a', examId: 'exam', studentId: 'student', status: 'IN_PROGRESS', sections, integrity: null, bandOverall: null };
  const exam = { category: 'GENERAL_ENGLISH', track: 'A1', sections: [
    { id: 'writing', type: 'WRITING', title: 'Essay', questions: [{ id: 'q', qtype: 'ESSAY', prompt: 'My town', maxScore: 1 }] },
    { id: 'reading', type: 'READING', title: 'Reading', questions: [0, 1, 2, 3].map(i => ({ id: `r${i}`, qtype: 'MCQ_SINGLE', answerKey: { index: 0 }, maxScore: 1 })) },
  ] };
  db.attempt.findUnique.mockImplementation(async () => attempt);
  db.exam.findUnique.mockResolvedValue(exam);
  db.attemptAnswer.findMany.mockImplementation(async ({ where }: any) => [
    { questionId: 'q', section: 'WRITING', answer: 'My town is nice.' },
    ...[0, 1, 2, 3].map(i => ({ questionId: `r${i}`, section: 'READING', answer: i === 3 ? 1 : 0 })),
  ].filter(a => !where.section || a.section === where.section));
  db.$transaction.mockImplementation((fn: any) => fn(db));
  db.attempt.update.mockImplementation(async ({ data }: any) => Object.assign(attempt, data));
  db.attemptSection.findUnique.mockImplementation(async () => sections[0]);
  db.attemptSection.update.mockImplementation(async ({ data }: any) => Object.assign(sections[0], data));

  const response = await POST(new Request('http://localhost/submit', { method: 'POST' }), { params: Promise.resolve({ attemptId: 'a' }) });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ writingGradingStatus: 'COMPLETED', overallPercent: 76 });
  expect(scoreGeneralWriting).toHaveBeenCalledWith('My town', 'My town is nice.', 'A1');
  expect(attempt.status).toBe('SUBMITTED');
  expect(attempt.bandOverall).toBe(76);
  expect(sections[0].rubric).toMatchObject({ generalWritingStatus: 'COMPLETED', generalOverall: 76, generalWritingPercent: 80, generalObjectivePercent: 75 });
  expect(await loadAttemptPercent('a', db)).toBe(76);
});
