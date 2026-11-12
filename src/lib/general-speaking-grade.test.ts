jest.mock('@/lib/prisma', () => ({ prisma: {
  attempt: { findUnique: jest.fn(), update: jest.fn() },
  attemptSection: { findUnique: jest.fn(), update: jest.fn() },
  attemptAnswer: { findMany: jest.fn() }, $transaction: jest.fn(), $queryRaw: jest.fn(),
} }));
jest.mock('@/lib/openai-client', () => ({ getOpenAI: jest.fn() }));
import { prisma } from './prisma';
import { getOpenAI } from './openai-client';
import { gradeGeneralSpeaking } from './general-speaking-grade';
const db = prisma as any;
const create = jest.fn();
const questions = [{ id: 'q', prompt: { text: 'Describe your town.' } }];
const answers = { q: { transcript: 'My town is small.', audioUrl: '/api/audio/recording.webm' } };
const run = () => gradeGeneralSpeaking('a', 's', questions, answers, 'A1');
beforeEach(() => {
  jest.clearAllMocks();
  (getOpenAI as jest.Mock).mockReturnValue({ chat: { completions: { create } } });
  create.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ score: 75, feedback: 'Clear, relevant response. Transcript-only assessment.' }) } }] });
  db.attempt.findUnique.mockResolvedValue({ status: 'SUBMITTED', integrity: null });
  db.attemptSection.findUnique.mockResolvedValue({ answers, rubric: { retained: true } });
  db.attemptAnswer.findMany.mockResolvedValue([{ questionId: 'q', answer: answers.q }]);
  db.$transaction.mockImplementation((fn: any) => fn(db));
});
test('saves a 100-point speaking grade while preserving overall and other rubric fields', async () => {
  expect((await run()).generalSpeaking.score).toBe(75);
  expect(db.attemptSection.update.mock.calls[0][0].data).toMatchObject({ rubric: { retained: true, generalSpeaking: { score: 75, assessmentType: 'TRANSCRIPT_ONLY' } } });
  expect(db.attempt.update).not.toHaveBeenCalled();
  expect(create.mock.calls[0][0].messages[1].content).toContain('My town is small.');
});
test('provider failure or invalid score never writes an incorrect grade', async () => {
  create.mockResolvedValue({ choices: [{ message: { content: '{"score":150,"feedback":"Invalid"}' } }] });
  await expect(run()).rejects.toThrow();
  expect(db.attemptSection.update).not.toHaveBeenCalled();
});
test('transcripts edited during assessment cannot save stale feedback', async () => {
  db.attemptAnswer.findMany.mockResolvedValue([{ questionId: 'q', answer: { transcript: 'Changed.' } }]);
  await expect(run()).rejects.toThrow('transcripts changed');
  expect(db.attemptSection.update).not.toHaveBeenCalled();
});
