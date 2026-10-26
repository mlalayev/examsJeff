import { GET } from '@/app/api/attempts/[attemptId]/results/route';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
jest.mock('@/lib/prisma', () => ({ prisma: { attempt: { findUnique: jest.fn() }, examIntegrity: { findUnique: jest.fn() }, attemptAnswer: { findMany: jest.fn() } } }));
jest.mock('@/lib/auth-utils', () => ({ requireAuth: jest.fn() }));
jest.mock('@/lib/coins', () => ({ getAttemptCoinReward: jest.fn() }));
const db = prisma as any;
beforeEach(() => {
  jest.clearAllMocks();
  (requireAuth as jest.Mock).mockResolvedValue({ id: 'admin', role: 'ADMIN' });
  db.examIntegrity.findUnique.mockResolvedValue({ state: 'INVALID' });
  db.attempt.findUnique.mockResolvedValue({ id: 'a', status: 'DISQUALIFIED', studentId: 'student', branchId: 'b', answers: null, sections: [], booking: { studentId: 'student', student: { email: 's@example.com' }, exam: { title: 'Test', category: 'GENERAL_ENGLISH', sections: [{ id: 'sec', type: 'READING', title: 'Reading', questions: [{ id: 'q', qtype: 'MCQ_SINGLE', prompt: { text: 'Question' }, options: ['Yes','No'], answerKey: { index: 0 } }] }] } } });
  db.attemptAnswer.findMany.mockImplementation(async ({where}: any) => where.section ? [] : [{ questionId: 'q', section: 'READING', answer: 0 }]);
});
test('staff can review a disqualified attempt using normalized saved answers', async () => {
  const response = await GET({} as any, { params: Promise.resolve({ attemptId: 'a' }) });
  const body = await response.json();
  expect(response.status).toBe(200);
  expect(body.reviewOnly).toBe(true);
  expect(body.status).toBe('DISQUALIFIED');
  expect(body.summary.totalCorrect).toBe(1);
  expect(body.summary.totalPercentage).toBe(100);
  expect(body.sections[0].questions[0].isCorrect).toBe(true);
});
test('unrelated branch staff cannot access invalidated answer keys', async () => {
  (requireAuth as jest.Mock).mockResolvedValue({ id: 'teacher', role: 'TEACHER', branchId: 'other' });
  const response = await GET({} as any, { params: Promise.resolve({ attemptId: 'a' }) });
  expect(response.status).toBe(403);
});
