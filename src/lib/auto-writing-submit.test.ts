jest.mock('@/lib/prisma', () => ({ prisma: {
  attempt: { findUnique: jest.fn(), update: jest.fn() }, exam: { findUnique: jest.fn() },
  attemptAnswer: { findMany: jest.fn() }, attemptSection: { update: jest.fn() }, $transaction: jest.fn(), $queryRaw: jest.fn(),
} }));
jest.mock('@/lib/auth-utils', () => ({ requireStudent: async () => ({ id: 'student' }) }));
jest.mock('@/lib/exam-integrity', () => ({ integrityBlock: async () => null }));
jest.mock('@/lib/coins', () => ({ tryAwardExamScoreReward: jest.fn() }));
jest.mock('@/lib/grade-general-writing', () => ({ gradeGeneralWritingAttempt: jest.fn() }));
import { prisma } from './prisma';
import { gradeGeneralWritingAttempt } from './grade-general-writing';
import { tryAwardExamScoreReward } from './coins';
import { POST } from '@/app/api/attempts/[attemptId]/submit/route';
const db = prisma as any;
const call = () => POST(new Request('http://localhost/submit', { method: 'POST' }), { params: Promise.resolve({ attemptId: 'a' }) });
beforeEach(() => {
  jest.clearAllMocks();
  db.attempt.findUnique.mockResolvedValue({ id: 'a', studentId: 'student', examId: 'exam', status: 'IN_PROGRESS', sections: [{ id: 'w', type: 'WRITING', answers: {} }] });
  db.exam.findUnique.mockResolvedValue({ category: 'GENERAL_ENGLISH', sections: [{ id: 's', type: 'WRITING', questions: [{ id: 'q', qtype: 'ESSAY', maxScore: 1 }] }] });
  db.attemptAnswer.findMany.mockResolvedValue([{ section: 'WRITING', questionId: 'q', answer: 'My essay' }]);
  db.$transaction.mockImplementation((fn: any) => fn(db));
  (gradeGeneralWritingAttempt as jest.Mock).mockResolvedValue({});
});
test('submit stores answers/status before automatic grading and defers rewards', async () => {
  (gradeGeneralWritingAttempt as jest.Mock).mockImplementation(async () => {
    expect(db.attempt.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'SUBMITTED', bandOverall: null }) }));
    return { generalOverall: 76 };
  });
  const response = await call();
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ writingGradingStatus: 'COMPLETED', overallPercent: 76 });
  expect(gradeGeneralWritingAttempt).toHaveBeenCalledTimes(1);
  expect(gradeGeneralWritingAttempt).toHaveBeenCalledWith('a');
  expect(tryAwardExamScoreReward).not.toHaveBeenCalled();
});
test('AI outage preserves submitted attempt with pending grade', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  (gradeGeneralWritingAttempt as jest.Mock).mockRejectedValue(new Error('Unavailable'));
  try {
    expect((await call()).status).toBe(200);
    expect(db.attemptSection.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ rubric: { generalWritingStatus: 'PENDING', generalOverall: null } }) }));
  } finally { log.mockRestore(); }
});

test('transient failure is retried automatically', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  (gradeGeneralWritingAttempt as jest.Mock).mockRejectedValueOnce(new Error('Temporary')).mockResolvedValue({ generalOverall: 86 });
  try {
    const response = await call();
    expect(await response.json()).toMatchObject({ writingGradingStatus: 'COMPLETED', overallPercent: 86 });
    expect(gradeGeneralWritingAttempt).toHaveBeenCalledTimes(2);
  } finally { log.mockRestore(); }
});
test('resubmission retries pending grading without resubmitting saved answers', async () => {
  db.attempt.findUnique.mockResolvedValue({ id: 'a', studentId: 'student', examId: 'exam', status: 'SUBMITTED', sections: [] });
  (gradeGeneralWritingAttempt as jest.Mock).mockResolvedValue({ generalOverall: 86 });
  expect((await (await call()).json()).overallPercent).toBe(86);
  expect(db.attempt.update).not.toHaveBeenCalled();
});
