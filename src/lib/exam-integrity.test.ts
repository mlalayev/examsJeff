jest.mock('@/lib/prisma', () => ({ prisma: {
  attempt: { findUnique: jest.fn(), update: jest.fn() },
  examIntegrity: { findUnique: jest.fn(), update: jest.fn() },
  examIntegrityEvent: { findUnique: jest.fn(), create: jest.fn(), count: jest.fn() },
  $queryRaw: jest.fn(), $transaction: jest.fn(),
} }));
jest.mock('@/lib/auth-utils', () => ({ requireAuth: jest.fn() }));
import { prisma } from './prisma';
import { requireAuth } from './auth-utils';
import { integrityBlock, canReviewIntegrity } from './exam-integrity';
import { newIntegrityPolicy, requiresLockdown } from './exam-integrity-policy';
import { POST } from '@/app/api/attempts/[attemptId]/integrity/route';
const db = prisma as any;
const context = { params: Promise.resolve({ attemptId: 'attempt' }) };
const request = (body: unknown) => new Request('http://localhost/api/integrity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const event = (kind: string) => request({ action: 'event', event: { id: 'event', kind } });
beforeEach(() => {
  jest.resetAllMocks();
  (requireAuth as jest.Mock).mockResolvedValue({ id: 'student', role: 'STUDENT' });
  db.$transaction.mockImplementation((fn: any) => fn(db));
  db.attempt.findUnique.mockResolvedValue({ id: 'attempt', studentId: 'student', branchId: 'b', status: 'IN_PROGRESS', integrity: { state: 'ACTIVE', policyVersion: 1 } });
  db.examIntegrityEvent.count.mockResolvedValue(0);
});
afterEach(() => { delete process.env.EXAM_LOCKDOWN_ENABLED; });
test.each(['SAT', 'MATH'])('%s never gets a new policy', category => {
  process.env.EXAM_LOCKDOWN_ENABLED = 'true'; expect(requiresLockdown(category)).toBe(false); expect(newIntegrityPolicy(category)).toBeUndefined();
});
test.each(['IELTS', 'TOEFL', 'PLACEMENT', 'GENERAL_ENGLISH', 'KIDS'])('%s gets policy only after rollout flag', category => {
  expect(newIntegrityPolicy(category)).toBeUndefined(); process.env.EXAM_LOCKDOWN_ENABLED = 'true'; expect(newIntegrityPolicy(category)).toEqual({ create: { policyVersion: 1 } });
});
test('legacy attempt is not blocked or enrolled retroactively', async () => {
  db.examIntegrity.findUnique.mockResolvedValue(null);
  expect(await integrityBlock('attempt')).toBeNull();
  db.attempt.findUnique.mockResolvedValue({ studentId: 'student', integrity: null });
  expect((await POST(event('FULLSCREEN_EXIT'), context)).status).toBe(200);
  expect(db.examIntegrity.update).not.toHaveBeenCalled();
  expect(db.attempt.update).not.toHaveBeenCalled();
});
test.each(['INVALID', 'PENDING'])('%s blocks server operations', async state => {
  db.examIntegrity.findUnique.mockResolvedValue({ state }); expect((await integrityBlock('attempt'))?.status).toBe(409);
});
test('active policy permits normal operations', async () => {
  db.examIntegrity.findUnique.mockResolvedValue({ state: 'ACTIVE' }); expect(await integrityBlock('attempt')).toBeNull();
});
test('fullscreen exit invalidates without deleting answers', async () => {
  const response = await POST(event('FULLSCREEN_EXIT'), context); expect(response.status).toBe(200);
  expect(db.examIntegrityEvent.create).toHaveBeenCalled();
  expect(db.attempt.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'DISQUALIFIED', bandOverall: null }) }));
  expect(db.attempt.update.mock.calls[0][0].data).not.toHaveProperty('answers');
});
test.each(['PAGE_HIDDEN', 'PAGE_LEAVE', 'OFFLINE', 'PASTE', 'WRITING_SNAPSHOT'])('%s is evidence only, never automatic cheating', async kind => {
  expect((await POST(event(kind), context)).status).toBe(200); expect(db.examIntegrityEvent.create).toHaveBeenCalled(); expect(db.attempt.update).not.toHaveBeenCalled();
});
test('late exit after submission is ignored', async () => {
  db.attempt.findUnique.mockResolvedValue({ studentId: 'student', status: 'SUBMITTED', integrity: { state: 'ACTIVE' } });
  expect((await POST(event('FULLSCREEN_EXIT'), context)).status).toBe(200); expect(db.attempt.update).not.toHaveBeenCalled();
});
test('event retry is idempotent', async () => {
  db.examIntegrityEvent.findUnique.mockResolvedValue({ id: 'event', attemptId: 'attempt' });
  await POST(event('FULLSCREEN_EXIT'), context); expect(db.examIntegrityEvent.create).not.toHaveBeenCalled();
});
test('another student cannot start or invalidate attempt', async () => {
  (requireAuth as jest.Mock).mockResolvedValue({ id: 'other', role: 'STUDENT' });
  expect((await POST(event('FULLSCREEN_EXIT'), context)).status).toBe(403); expect(db.attempt.update).not.toHaveBeenCalled();
});
test('initial acceptance starts clock; resume does not reset it', async () => {
  const start = () => request({ action: 'start', accepted: true, policyVersion: 1 });
  await POST(start(), context); expect(db.attempt.update).not.toHaveBeenCalled();
  db.attempt.findUnique.mockResolvedValue({ studentId: 'student', status: 'IN_PROGRESS', integrity: { state: 'PENDING' } });
  await POST(start(), context); expect(db.attempt.update).toHaveBeenCalledWith({ where: { id: 'attempt' }, data: { startedAt: expect.any(Date) } });
});
test('review respects branch boundary and cannot silently restore result', async () => {
  expect(canReviewIntegrity({ id: 't', role: 'TEACHER', branchId: 'other' }, { studentId: 's', branchId: 'b' })).toBe(false);
  (requireAuth as jest.Mock).mockResolvedValue({ id: 'creator', role: 'CREATOR' });
  expect((await POST(request({ action: 'review', note: 'Technical incident reviewed.' }), context)).status).toBe(200);
  expect(db.attempt.update).not.toHaveBeenCalled();
  expect(db.examIntegrity.update.mock.calls[0][0].data).not.toHaveProperty('state');
});
