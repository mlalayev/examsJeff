jest.mock('@/lib/auth-utils', () => ({ requireAdmin: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: { exam: { findUnique: jest.fn() }, attempt: { create: jest.fn(), delete: jest.fn() }, booking: { findFirst: jest.fn() } } }));
import { requireAdmin } from './auth-utils';
import { prisma } from './prisma';
import { POST } from '@/app/api/admin/exams/[id]/test-attempt/route';
const db = prisma as any;
const context = { params: Promise.resolve({ id: 'exam' }) };
beforeEach(() => {
  jest.resetAllMocks();
  (requireAdmin as jest.Mock).mockResolvedValue({ id: 'admin', branchId: 'branch' });
  db.exam.findUnique.mockResolvedValue({ category: 'SAT', sections: [{ type: 'READING' }, { type: 'GRAMMAR' }] });
  db.attempt.create.mockResolvedValueOnce({ id: 'fresh1' }).mockResolvedValueOnce({ id: 'fresh2' });
});
test('repeated Test clicks create different IDs without reusing or deleting old attempts', async () => {
  const first = await POST(new Request('http://localhost'), context);
  const second = await POST(new Request('http://localhost'), context);
  expect((await first.json()).attemptId).toBe('fresh1');
  expect((await second.json()).attemptId).toBe('fresh2');
  expect(db.booking.findFirst).not.toHaveBeenCalled(); expect(db.attempt.delete).not.toHaveBeenCalled();
  const data = db.attempt.create.mock.calls[0][0].data;
  expect(data.booking.create.studentId).toBe('admin');
  expect(data.status).toBe('IN_PROGRESS'); expect(data).not.toHaveProperty('answers');
  expect(data.sections.create.every((s: any) => s.status === 'IN_PROGRESS')).toBe(true);
});
test('unauthorized caller cannot create a test', async () => {
  (requireAdmin as jest.Mock).mockRejectedValue(new Error('Forbidden'));
  expect((await POST(new Request('http://localhost'), context)).status).toBe(403);
  expect(db.attempt.create).not.toHaveBeenCalled();
});
test('empty exam does not create booking or attempt', async () => {
  db.exam.findUnique.mockResolvedValue({ sections: [] });
  expect((await POST(new Request('http://localhost'), context)).status).toBe(400);
  expect(db.attempt.create).not.toHaveBeenCalled();
});
