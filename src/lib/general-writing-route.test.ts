jest.mock('@/lib/coins', () => ({ tryAwardExamScoreReward: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: {
  attempt: { findUnique: jest.fn(), update: jest.fn() }, exam: { findUnique: jest.fn() }, attemptAnswer: { findMany: jest.fn() },
  attemptSection: { findUnique: jest.fn(), update: jest.fn() },
  $transaction: jest.fn(), $queryRaw: jest.fn(),
} }));
jest.mock('@/lib/auth-utils', () => ({ requireAuth: jest.fn(async () => ({ id: 'teacher', role: 'TEACHER' })) }));
jest.mock('@/lib/exam-integrity', () => ({ integrityBlock: async () => null, canReviewIntegrity: () => true }));
jest.mock('@/lib/teacher-exam-scope', () => ({ teacherStudentScope: jest.fn(async () => ({ categories: ['GENERAL_ENGLISH', 'IELTS'] })) }));
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: () => ({ limited: false }) }));
jest.mock('@/lib/general-writing-ai', () => ({ ...jest.requireActual('./general-writing-ai'), scoreGeneralWriting: jest.fn(async () => ({ score: 80, feedback: 'Feedback' })) }));
jest.mock('@/lib/ielts-writing-ai-score', () => ({ scoreIELTSWritingFull: jest.fn() }));
import { prisma } from './prisma';
import { scoreGeneralWriting } from './general-writing-ai';
import { scoreIELTSWritingFull } from './ielts-writing-ai-score';
import { teacherStudentScope } from './teacher-exam-scope';
import { POST } from '@/app/api/attempts/[attemptId]/writing/ai-score/route';
const db = prisma as any;
const oldKey = process.env.OPENAI_API_KEY;
let attempt: any;
const call = () => POST(new Request('http://localhost/score', { method: 'POST', body: '{}' }) as any, { params: Promise.resolve({ attemptId: 'a' }) });
beforeEach(() => {
  jest.clearAllMocks(); process.env.OPENAI_API_KEY = 'test';
  (teacherStudentScope as jest.Mock).mockResolvedValue({ categories: ['GENERAL_ENGLISH', 'IELTS'] });
  attempt = { id: 'a', examId: 'exam', studentId: 'student', status: 'SUBMITTED', sections: [{ id: 'as', type: 'WRITING', answers: {} }], booking: { exam: { category: 'GENERAL_ENGLISH', track: 'A1', sections: [{ id: 's1', title: 'Writing', type: 'WRITING', questions: [{ id: 'q1', qtype: 'ESSAY', prompt: 'Write about your town' }] }] } } };
  db.attempt.findUnique.mockImplementation(async () => attempt);
  db.exam.findUnique.mockImplementation(async () => attempt.booking.exam);
  db.attemptAnswer.findMany.mockResolvedValue([{ questionId: 'q1', answer: 'My town.' }]);
  db.attemptSection.findUnique.mockResolvedValue({ rubric: { other: true } });
  db.$transaction.mockImplementation((fn: any) => fn(db));
});
afterEach(() => { if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey; });
test('one essay is scored and persisted without IELTS two-task validation', async () => {
  expect((await call()).status).toBe(200);
  expect(db.attempt.update).toHaveBeenCalledWith({ where: { id: 'a' }, data: { bandOverall: 80 } });
  expect(scoreGeneralWriting).toHaveBeenCalledWith('Write about your town', 'My town.', 'A1');
  expect(scoreIELTSWritingFull).not.toHaveBeenCalled();
  expect(db.attemptSection.update.mock.calls[0][0].data.rubric).toMatchObject({ other: true, generalWriting: [{ questionId: 'q1', score: 80 }] });
});
test('repeated writing sections keep independent questions and reuse saved scores', async () => {
  attempt.booking.exam.sections.push({ id: 's2', title: 'Writing', type: 'WRITING', questions: [{ id: 'q2', qtype: 'ESSAY', prompt: 'Second task' }] });
  db.attemptAnswer.findMany.mockResolvedValue([{ questionId: 'q1', answer: 'First' }, { questionId: 'q2', answer: 'Second' }]);
  const result = await (await call()).json();
  expect(result.generalWriting.map((a: any) => a.sectionId)).toEqual(['s1', 's2']);
  attempt.sections[0].rubric = { generalWriting: result.generalWriting };
  (scoreGeneralWriting as jest.Mock).mockClear();
  expect((await (await call()).json()).cached).toBe(true);
  expect(scoreGeneralWriting).not.toHaveBeenCalled();
});
test('IELTS still requires both tasks', async () => {
  attempt.booking.exam.category = 'IELTS';
  expect((await call()).status).toBe(400);
  expect(scoreGeneralWriting).not.toHaveBeenCalled();
});
test('saved overall includes objective answers and writing at 80/20', async () => {
  attempt.booking.exam.sections.push({ id: 'reading', title: 'Reading', type: 'READING', questions: [
    { id: 'r1', qtype: 'MCQ_SINGLE', answerKey: { index: 0 }, maxScore: 1 },
    { id: 'r2', qtype: 'MCQ_SINGLE', answerKey: { index: 0 }, maxScore: 1 },
  ] });
  db.attemptAnswer.findMany.mockResolvedValue([{ questionId: 'q1', answer: 'Essay' }, { questionId: 'r1', answer: 0 }, { questionId: 'r2', answer: 1 }]);
  const result = await (await call()).json();
  expect(result.generalOverall).toBe(56); // Objective 50% * 0.8 + writing 80% * 0.2.
  expect(db.attempt.update).toHaveBeenCalledWith({ where: { id: 'a' }, data: { bandOverall: 56 } });
});
test('unrelated subject teachers cannot grade', async () => {
  (teacherStudentScope as jest.Mock).mockResolvedValue({ categories: ['MATH'] });
  expect((await call()).status).toBe(403);
  expect(scoreGeneralWriting).not.toHaveBeenCalled();
});
