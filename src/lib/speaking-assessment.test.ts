jest.mock('@/lib/openai-client', () => ({ getOpenAI: jest.fn(), handleOpenAIError: (e: Error) => { throw e; } }));
jest.mock('@/lib/prisma', () => ({ prisma: {
  examIntegrity: { findUnique: jest.fn() },
  attempt: { findUnique: jest.fn() }, exam: { findUnique: jest.fn() },
  attemptAnswer: { findMany: jest.fn() },
  attemptSection: { update: jest.fn(), findUniqueOrThrow: jest.fn() },
  $transaction: jest.fn(), $queryRaw: jest.fn(),
} }));
jest.mock('@/lib/auth-utils', () => ({ requireAuth: jest.fn(async () => ({ id: 'admin', role: 'ADMIN' })) }));
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: () => ({ limited: false }) }));
jest.mock('@/lib/coins', () => ({ getAttemptCoinReward: async () => null }));
import { getOpenAI } from './openai-client';
import { scoreIELTSSpeakingFromPayload } from './ielts-speaking-ai-score';
import { POST as score } from '@/app/api/attempts/[attemptId]/speaking/ai-score/route';
import { GET as results } from '@/app/api/attempts/[attemptId]/results/route';
import { prisma } from './prisma';
import { requireAuth } from './auth-utils';
const db = prisma as any;
const payload = { part1: [{ questionId: 'q', prompt: 'Why?', transcript: 'Because I enjoy reading.' }], part2: [], part3: [] };
const context = { params: Promise.resolve({ attemptId: 'attempt' }) };
const generated = { fluencyCoherence: 6, lexicalResource: 7, grammar: 6.5, pronunciation: 9, overallBand: 9,
  part1: { band: 9, feedback: 'Feedback' }, part2: { band: 9, feedback: '' }, part3: { band: 9, feedback: '' }, overallFeedback: 'Feedback' };
const create = jest.fn();
beforeEach(() => {
  jest.clearAllMocks(); process.env.OPENAI_API_KEY = 'test-only';
  create.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(generated) } }] });
  (getOpenAI as jest.Mock).mockReturnValue({ chat: { completions: { create } } });
  const section = { id: 'as', type: 'SPEAKING', answers: { q: { text: '', audioUrl: '/api/audio/test.webm' } }, rubric: {} };
  const exam = { category: 'IELTS', title: 'Test', sections: [{ id: 's', type: 'SPEAKING', parentSectionId: null, questions: [{ id: 'q', qtype: 'SPEAKING_RECORDING', order: 0, prompt: { text: 'Why?', part: 1 } }] }] };
  db.attempt.findUnique.mockResolvedValue({ id: 'attempt', studentId: 'student', status: 'SUBMITTED', examId: 'exam', sections: [section], booking: { exam, studentId: 'student', student: { name: 'Student' } } });
  db.attemptSection.findUniqueOrThrow.mockResolvedValue(section);
  db.attemptAnswer.findMany.mockResolvedValue([{ questionId: 'q', answer: { text: 'Because I enjoy reading.', audioUrl: '/api/audio/test.webm' } }]);
  db.$transaction.mockImplementation((fn: any) => fn(db));
  db.attemptSection.update.mockImplementation(async ({ data }: any) => data);
});
afterEach(() => { delete process.env.OPENAI_API_KEY; });
test('text-only estimate excludes fabricated pronunciation and part averages', async () => {
  const result = await scoreIELTSSpeakingFromPayload(payload);
  expect(result.overallBand).toBe(6.5);
  expect(result.pronunciation).toBeNull();
  expect(result.assessmentType).toBe('TRANSCRIPT_ONLY');
});
test('invalid AI criteria are rejected instead of saving a zero score', async () => {
  create.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ ...generated, grammar: 'invalid' }) } }] });
  await expect(scoreIELTSSpeakingFromPayload(payload)).rejects.toThrow('Invalid AI speaking score');
});
test('AI scoring reads normalized transcripts even when section snapshot is empty', async () => {
  const response = await score(new Request('http://localhost/score', { method: 'POST', body: '{}' }) as any, context);
  expect(response.status).toBe(200);
  expect(create.mock.calls[0][0].messages[1].content).toContain('Because I enjoy reading.');
  expect(db.attemptSection.update).toHaveBeenCalled();
});
test('untranscribed audio blocks grading rather than being penalized as unanswered', async () => {
  db.attemptAnswer.findMany.mockResolvedValue([{ questionId: 'q', answer: { text: '', audioUrl: '/api/audio/test.webm' } }]);
  const response = await score(new Request('http://localhost/score', { method: 'POST', body: '{}' }) as any, context);
  expect(response.status).toBe(409);
  expect((await response.json()).questionIds).toEqual(['q']);
  expect(create).not.toHaveBeenCalled();
});
test('results include saved audio, transcript and AI assessment', async () => {
  const attempt = await db.attempt.findUnique();
  attempt.sections[0].rubric = { ieltsSpeakingAi: { ...generated, scoredAt: '2026-10-02T10:00:00Z' } };
  const response = await results(new Request('http://localhost/results') as any, context);
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.speakingAi.scoredAt).toBe('2026-10-02T10:00:00Z');
  expect(body.speakingRecordings[0].answer).toEqual({ text: 'Because I enjoy reading.', audioUrl: '/api/audio/test.webm' });
});
test('student results also expose their own recordings, transcripts and saved AI feedback', async () => {
  (requireAuth as jest.Mock).mockResolvedValueOnce({ id: 'student', role: 'STUDENT' });
  const attempt = await db.attempt.findUnique();
  attempt.sections[0].rubric = { ieltsSpeakingAi: { ...generated, scoredAt: '2026-10-02T10:00:00Z' } };
  const response = await results(new Request('http://localhost/results') as any, context);
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.role).toBe('STUDENT');
  expect(body.speakingAi).toBeTruthy();
  expect(body.speakingRecordings[0].answer.text).toBe('Because I enjoy reading.');
  expect(body.speakingRecordings[0].correctAnswer).toBeUndefined();
});
test('a transcript changed during assessment prevents saving stale AI feedback', async () => {
  db.attemptAnswer.findMany.mockResolvedValueOnce([{ questionId: 'q', answer: { text: 'Initial transcript' } }])
    .mockResolvedValueOnce([{ questionId: 'q', answer: { text: 'Updated transcript' } }]);
  const response = await score(new Request('http://localhost/score', { method: 'POST', body: '{}' }) as any, context);
  expect(response.status).toBe(409);
  expect(db.attemptSection.update).not.toHaveBeenCalled();
});
test('all legacy speaking sections are included in the AI payload', async () => {
  const attempt = await db.attempt.findUnique();
  attempt.booking.exam.sections.push({ id: 'part2-section', type: 'SPEAKING', parentSectionId: null,
    questions: [{ id: 'q-part2', qtype: 'SPEAKING_RECORDING', order: 1, prompt: { text: 'Describe a place', part: 2 } }] });
  db.attemptAnswer.findMany.mockResolvedValue([{ questionId: 'q', answer: { text: 'First answer' } }, { questionId: 'q-part2', answer: { text: 'Second part answer' } }]);
  const response = await score(new Request('http://localhost/score', { method: 'POST', body: '{}' }) as any, context);
  expect(response.status).toBe(200);
  expect(create.mock.calls[0][0].messages[1].content).toContain('Second part answer');
});
