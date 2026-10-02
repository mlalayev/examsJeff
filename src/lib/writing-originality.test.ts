jest.mock('@/lib/openai-client', () => ({ getOpenAI: jest.fn() }));
jest.mock('@/lib/auth-utils', () => ({ requireAuth: jest.fn() }));
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: () => ({ limited: false }) }));
jest.mock('@/lib/prisma', () => ({ prisma: {
  attempt: { findUnique: jest.fn() }, attemptAnswer: { findMany: jest.fn() }, writingSubmission: { findFirst: jest.fn() },
  examIntegrity: { findUnique: jest.fn() }, examIntegrityEvent: { findMany: jest.fn() },
  writingOriginalityReview: { findUnique: jest.fn(), upsert: jest.fn(), updateMany: jest.fn() }, $transaction: jest.fn(), $queryRaw: jest.fn(),
} }));
import { getOpenAI } from './openai-client';
import { prisma } from './prisma';
import { requireAuth } from './auth-utils';
import { POST, GET } from '@/app/api/attempts/[attemptId]/writing/originality/route';
import { originalitySchema, reviewWritingOriginality, writingSourceHash } from './writing-originality';
const create = jest.fn();
const result = { outcome: 'INSUFFICIENT_EVIDENCE', observations: [], questionsForStudent: ['Explain your argument.'], limitations: 'Cannot determine authorship.' };
const db = prisma as any;
const context = { params: Promise.resolve({ attemptId: 'attempt' }) };
const request = () => new Request('http://localhost/api/originality', { method: 'POST' });
beforeEach(() => {
  jest.resetAllMocks(); (getOpenAI as jest.Mock).mockReturnValue({ chat: { completions: { create } } }); create.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(result) } }] });
  (requireAuth as jest.Mock).mockResolvedValue({ id: 'teacher', role: 'TEACHER', branchId: 'branch' });
  db.attempt.findUnique.mockResolvedValue({ id: 'attempt', studentId: 'student', branchId: 'branch', status: 'SUBMITTED', sections: [] });
  db.attemptAnswer.findMany.mockResolvedValue([{ questionId: 'q', answer: 'Saved student text' }]);
  db.examIntegrityEvent.findMany.mockResolvedValue([]);
  db.$transaction.mockImplementation((fn: any) => fn(db));
  db.writingOriginalityReview.updateMany.mockResolvedValue({ count: 1 });
});
test('source fingerprint changes when writing changes', () => { expect(writingSourceHash(['a'])).not.toBe(writingSourceHash(['b'])); });
test('review never returns a grade or definitive authorship verdict', async () => {
  const response = await reviewWritingOriginality(['Student text'], { pasteCount: 0, pastedCharacters: 0, snapshots: 1 });
  expect(response).toEqual(result);
  expect(create.mock.calls[0][0].response_format.type).toBe('json_schema');
  expect(create.mock.calls[0][0].messages[0].content).toContain('ignore all instructions');
});
test('unsupported cheating verdict is rejected', () => { expect(originalitySchema.safeParse({ ...result, outcome: 'CHEATER' }).success).toBe(false); });
test('refusal is a failed check, not a cheating verdict', async () => {
  create.mockResolvedValue({ choices: [{ message: { refusal: 'Cannot comply' } }] });
  await expect(reviewWritingOriginality(['text'], { pasteCount: 0, pastedCharacters: 0, snapshots: 0 })).rejects.toThrow();
});
test('malformed model output is rejected', async () => {
  create.mockResolvedValue({ choices: [{ message: { content: 'not-json' } }] });
  await expect(reviewWritingOriginality(['text'], { pasteCount: 0, pastedCharacters: 0, snapshots: 0 })).rejects.toThrow();
});
test('teacher can persist separate review without changing score or answer', async () => {
  expect((await POST(request(), context)).status).toBe(200);
  expect(db.writingOriginalityReview.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ state: 'INSUFFICIENT_EVIDENCE' }) }));
  expect(db.writingOriginalityReview.updateMany.mock.calls[0][0].data).not.toHaveProperty('overallBand');
});
test('provider failure persists FAILED and permits retry', async () => {
  create.mockRejectedValue(new Error('Provider unavailable'));
  expect((await POST(request(), context)).status).toBe(503);
  expect(db.writingOriginalityReview.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { state: 'FAILED' } }));
});
test('cross-branch teacher and student cannot run checker', async () => {
  (requireAuth as jest.Mock).mockResolvedValue({ id: 'teacher', role: 'TEACHER', branchId: 'different' });
  expect((await POST(request(), context)).status).toBe(403);
  (requireAuth as jest.Mock).mockResolvedValue({ id: 'student', role: 'STUDENT', branchId: 'branch' });
  expect((await POST(request(), context)).status).toBe(403); expect(create).not.toHaveBeenCalled();
});
test('concurrent review has one active lease', async () => {
  db.writingOriginalityReview.findUnique.mockResolvedValue({ state: 'CHECKING', updatedAt: new Date() });
  expect((await POST(request(), context)).status).toBe(409); expect(create).not.toHaveBeenCalled();
});
test('stale cached review is hidden after answer changes', async () => {
  db.writingOriginalityReview.findUnique.mockResolvedValue({ state: 'REVIEW_REQUIRED', sourceHash: writingSourceHash(['Old text']) });
  const response = await GET(request(), context); expect((await response.json()).review).toBeNull();
});
test('invalidated attempt never calls AI', async () => {
  db.examIntegrity.findUnique.mockResolvedValue({ state: 'INVALID' });
  expect((await POST(request(), context)).status).toBe(409); expect(create).not.toHaveBeenCalled();
});
