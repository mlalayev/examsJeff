jest.mock('@/lib/auth-utils', () => ({ requireAuth: jest.fn(async () => ({ id: 'student' })), requireStudent: jest.fn(async () => ({ id: 'student' })) }));
jest.mock('@/lib/prisma', () => ({ prisma: {
  attempt: { findFirst: jest.fn(), findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), update: jest.fn() },
  exam: { findUnique: jest.fn() },
  question: { findFirst: jest.fn() },
  attemptAnswer: { upsert: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  attemptSection: { findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn(), findFirst: jest.fn() },
  $queryRaw: jest.fn(), $transaction: jest.fn(),
} }));
jest.mock('fs/promises', () => ({ writeFile: jest.fn(async () => {}), mkdir: jest.fn(async () => {}), unlink: jest.fn(async () => {}) }));
jest.mock('fs', () => ({ ...jest.requireActual('fs'), createReadStream: jest.fn(() => ({})) }));
jest.mock('@/lib/openai-client', () => ({ getOpenAI: jest.fn(), handleOpenAIError: (error: Error) => { throw error; } }));
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: () => ({ limited: false }) }));
jest.mock('@/lib/rate-limiter-enhanced', () => ({ applyRateLimit: async () => null }));
jest.mock('@/lib/security', () => ({ validateBodySize: () => ({ valid: true }) }));

import { POST as upload } from '@/app/api/attempts/[attemptId]/speaking/upload/route';
import { POST as transcribe } from '@/app/api/attempts/[attemptId]/speaking/transcribe/route';
import { POST as save } from '@/app/api/attempts/[attemptId]/save/route';
import { POST as bulkSave } from '@/app/api/attempts/[attemptId]/save-bulk/route';
import { prisma } from '@/lib/prisma';
import { getOpenAI } from '@/lib/openai-client';
import { writeFile } from 'fs/promises';
const db = prisma as any;
const context = { params: Promise.resolve({ attemptId: 'attempt' }) };
function request(extension = 'webm', size = 8) {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(size)], { type: `audio/${extension}` }), `recording.${extension}`);
  form.append('questionId', 'q');
  return new Request('http://localhost/upload', { method: 'POST', body: form });
}
beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.OPENAI_API_KEY;
  db.attempt.findFirst.mockResolvedValue({ id: 'attempt', examId: 'exam', status: 'IN_PROGRESS' });
  db.attempt.findUnique.mockResolvedValue({ id: 'attempt', examId: 'exam', studentId: 'student', sections: [{ id: 'section' }] });
  db.exam.findUnique.mockResolvedValue({ category: 'IELTS' });
  db.attempt.findUniqueOrThrow.mockResolvedValue({ status: 'IN_PROGRESS', answers: {} });
  db.question.findFirst.mockResolvedValue({ id: 'q' });
  db.attemptSection.findMany.mockResolvedValue([{ id: 'section', answers: { previous: 'kept' } }]);
  db.attemptAnswer.findUnique.mockResolvedValue({ id: 'row', answer: { text: '', audioUrl: '/api/audio/saved.webm' } });
  db.$transaction.mockImplementation((fn: any) => fn(db));
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
test('stale IELTS autosave cannot overwrite a saved recording', async () => {
  const req = new Request('http://localhost/save', { method: 'POST', body: JSON.stringify({ sectionType: 'SPEAKING', answers: {} }) });
  expect((await save(req, context)).status).toBe(200);
  expect(db.attemptSection.updateMany).not.toHaveBeenCalled();
  expect(db.attemptAnswer.upsert).not.toHaveBeenCalled();
});
test('bulk sync cannot erase IELTS recordings with an empty browser snapshot', async () => {
  const req = new Request('http://localhost/save-bulk', { method: 'POST', body: JSON.stringify({ sections: [{ sectionType: 'SPEAKING', answers: {} }] }) });
  expect((await bulkSave(req, context)).status).toBe(200);
  expect(db.attemptSection.updateMany).not.toHaveBeenCalled();
});
test('non-IELTS Speaking text still uses bulk autosave', async () => {
  db.exam.findUnique.mockResolvedValue({ category: 'TOEFL' });
  const req = new Request('http://localhost/save-bulk', { method: 'POST', body: JSON.stringify({ sections: [{ sectionType: 'SPEAKING', answers: { q: 'typed answer' } }] }) });
  expect((await bulkSave(req, context)).status).toBe(200);
  expect(db.attemptSection.updateMany).toHaveBeenCalledWith({ where: { attemptId: 'attempt', type: 'SPEAKING' }, data: { answers: { q: 'typed answer' } } });
  expect(db.attemptAnswer.upsert).toHaveBeenCalled();
});
afterEach(() => { jest.restoreAllMocks(); delete process.env.OPENAI_API_KEY; });

test.each(['webm', 'mp4'])('audio %s is persisted without an AI key and preserves other answers', async (ext) => {
  const response = await upload(request(ext), context);
  expect(response.status).toBe(201);
  const result = await response.json();
  expect(result.url).toMatch(new RegExp(`^/api/audio/.*\\.${ext}$`));
  expect(db.attemptAnswer.upsert).toHaveBeenCalled();
  expect(db.attemptSection.update.mock.calls[0][0].data.answers.previous).toBe('kept');
  expect(getOpenAI).not.toHaveBeenCalled();
});
test('rejects a question from another exam before writing a file', async () => {
  db.question.findFirst.mockResolvedValue(null);
  expect((await upload(request(), context)).status).toBe(400);
  expect(writeFile).not.toHaveBeenCalled();
});
test.each([
  [null, 'exam', 'SPEAKING', 201],
  ['legacy-exam', 'exam', 'SPEAKING', 201],
  ['exam', 'other-exam', 'SPEAKING', 400],
  [null, 'exam', 'READING', 400],
])('validates through the section: direct exam=%s section exam=%s type=%s', async (directExamId, sectionExamId, sectionType, expectedStatus) => {
  const row = { id: 'q', examId: directExamId, section: { examId: sectionExamId, type: sectionType } };
  db.question.findFirst.mockImplementationOnce(async ({ where }: any) => {
    if (where.id !== row.id) return null;
    if (where.examId !== undefined && where.examId !== row.examId) return null;
    if (where.section.examId !== undefined && where.section.examId !== row.section.examId) return null;
    if (where.section.type !== row.section.type) return null;
    return { id: row.id };
  });
  expect((await upload(request(), context)).status).toBe(expectedStatus);
  if (expectedStatus === 201) expect(db.attemptAnswer.upsert).toHaveBeenCalled();
  else expect(writeFile).not.toHaveBeenCalled();
});
test('empty recording is rejected', async () => {
  expect((await upload(request('webm', 0), context)).status).toBe(400);
});
test('submitted attempts cannot receive new recordings', async () => {
  db.attempt.findFirst.mockResolvedValue({ examId: 'exam', status: 'SUBMITTED' });
  expect((await upload(request(), context)).status).toBe(409);
  expect(writeFile).not.toHaveBeenCalled();
});
test('recordings over 10MB are rejected', async () => {
  expect((await upload(request('webm', 10 * 1024 * 1024 + 1), context)).status).toBe(400);
  expect(writeFile).not.toHaveBeenCalled();
});
test('attempts without section rows preserve JSON answers', async () => {
  db.attemptSection.findMany.mockResolvedValue([]);
  db.attempt.findUniqueOrThrow.mockResolvedValue({ status: 'IN_PROGRESS', answers: { READING: { q1: 'A' }, SPEAKING: { old: 'prior' } } });
  expect((await upload(request(), context)).status).toBe(201);
  const answers = db.attempt.update.mock.calls[0][0].data.answers;
  expect(answers.READING).toEqual({ q1: 'A' });
  expect(answers.SPEAKING.old).toBe('prior');
  expect(answers.SPEAKING.q.audioUrl).toMatch(/^\/api\/audio\//);
});
test('DB failure does not claim recording was saved', async () => {
  db.$transaction.mockRejectedValueOnce(new Error('database unavailable'));
  expect((await upload(request(), context)).status).toBe(500);
});
test('missing AI key leaves the durable answer untouched', async () => {
  expect((await transcribe(request() as any, context)).status).toBe(503);
  expect(db.attemptAnswer.update).not.toHaveBeenCalled();
});
test('AI failure leaves the durable answer untouched', async () => {
  process.env.OPENAI_API_KEY = 'test-only';
  (getOpenAI as jest.Mock).mockReturnValue({ audio: { transcriptions: { create: jest.fn().mockRejectedValue(new Error('quota')) } } });
  expect((await transcribe(request() as any, context)).status).toBe(500);
  expect(db.attemptAnswer.update).not.toHaveBeenCalled();
});
test('successful transcription persists text with the original audio URL', async () => {
  process.env.OPENAI_API_KEY = 'test-only';
  (getOpenAI as jest.Mock).mockReturnValue({ audio: { transcriptions: { create: jest.fn().mockResolvedValue({ text: 'My answer' }) } } });
  expect((await transcribe(request('mp4') as any, context)).status).toBe(200);
  expect(db.attemptAnswer.update).toHaveBeenCalledWith({ where: { id: 'row' }, data: { answer: { text: 'My answer', audioUrl: '/api/audio/saved.webm' } } });
});
test('late transcription cannot replace a newer recording', async () => {
  process.env.OPENAI_API_KEY = 'test-only';
  (getOpenAI as jest.Mock).mockReturnValue({ audio: { transcriptions: { create: jest.fn().mockResolvedValue({ text: 'Old answer' }) } } });
  db.attemptAnswer.findUnique.mockResolvedValueOnce({ id: 'row', answer: { audioUrl: '/api/audio/old.webm' } })
    .mockResolvedValueOnce({ id: 'row', answer: { audioUrl: '/api/audio/new.webm' } });
  expect((await transcribe(request() as any, context)).status).toBe(200);
  expect(db.attemptAnswer.update).not.toHaveBeenCalled();
});
