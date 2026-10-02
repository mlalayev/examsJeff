jest.mock('@/lib/prisma', () => ({ prisma: {
  user: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  attempt: { findMany: jest.fn(), count: jest.fn() },
} }));
jest.mock('@/lib/auth-utils', () => ({ requireAuth: jest.fn() }));
jest.mock('@/lib/user-password', () => ({ updateUserPassword: jest.fn() }));
import { PATCH as editAccount } from '@/app/api/admin/users/[id]/route';
import { GET } from '@/app/api/creator/users/[id]/route';
import { PATCH } from '@/app/api/creator/users/[id]/approve/route';
import { prisma } from './prisma';
import { requireAuth } from './auth-utils';
const db = prisma as any;
const context = { params: Promise.resolve({ id: 'user' }) };
const request = (body = {}) => new Request('http://localhost/api/users/user', {
  method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
beforeEach(() => {
  jest.resetAllMocks();
  (requireAuth as jest.Mock).mockResolvedValue({ role: 'CREATOR' });
  db.user.findUnique.mockResolvedValue({ id: 'user', firstName: 'Ali', lastName: 'Test',
    studentProfile: { teacher: { firstName: 'Teacher', lastName: 'One' } },
    assignmentsAsTeacher: [{ student: { firstName: 'Student', lastName: null } }], _count: {} });
  db.attempt.findMany.mockResolvedValue([]);
  db.attempt.count.mockResolvedValue(0);
  db.user.update.mockResolvedValue({ id: 'user', firstName: 'Ali', lastName: 'Test' });
});
test('creator details select real User fields and preserve display names', async () => {
  const response = await GET(request(), context);
  expect(response.status).toBe(200);
  const { user } = await response.json();
  expect(user.name).toBe('Ali Test');
  expect(user.studentProfile.teacher.name).toBe('Teacher One');
  expect(user.assignmentsAsTeacher[0].student.name).toBe('Student');
  const select = db.user.findUnique.mock.calls[0][0].select;
  for (const fields of [select, select.studentProfile.select.teacher.select, select.assignmentsAsTeacher.select.student.select]) {
    expect(fields.name).toBeUndefined();
    expect(fields.firstName).toBe(true);
    expect(fields.lastName).toBe(true);
  }
});
test.each(['PARENT', 'PARTNER'])('creator can update %s role', async (role) => {
  expect((await PATCH(request({ approved: true, role }), context)).status).toBe(200);
  expect(db.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { approved: true, role } }));
});
test('invalid role is rejected with validation details', async () => {
  const response = await PATCH(request({ approved: true, role: 'INVALID' }), context);
  expect(response.status).toBe(400);
  expect((await response.json()).details.length).toBeGreaterThan(0);
  expect(db.user.update).not.toHaveBeenCalled();
});
test('non-creators cannot read or modify creator-only details', async () => {
  (requireAuth as jest.Mock).mockResolvedValue({ role: 'STUDENT' });
  expect((await GET(request(), context)).status).toBe(403);
  expect((await PATCH(request({ approved: true }), context)).status).toBe(403);
  expect(db.user.findUnique).not.toHaveBeenCalled();
  expect(db.user.update).not.toHaveBeenCalled();
});
test('creator can save account names, email and branch through shared editor API', async () => {
  const response = await editAccount(request({ firstName: 'Updated', lastName: 'User', email: 'updated@example.com', branchId: 'branch' }), context);
  expect(response.status).toBe(200);
  expect(db.user.update).toHaveBeenCalledWith({ where: { id: 'user' }, data: {
    firstName: 'Updated', lastName: 'User', email: 'updated@example.com', branchId: 'branch',
  } });
});
test('creator can edit own details without reassigning protected role', async () => {
  db.user.findUnique.mockResolvedValue({ id: 'user', role: 'CREATOR' });
  expect((await editAccount(request({ firstName: 'Updated' }), context)).status).toBe(200);
  expect(db.user.update).toHaveBeenCalledWith({ where: { id: 'user' }, data: { firstName: 'Updated' } });
});
test('admin still cannot edit a creator account', async () => {
  (requireAuth as jest.Mock).mockResolvedValue({ role: 'ADMIN' });
  db.user.findUnique.mockResolvedValue({ id: 'user', role: 'CREATOR' });
  expect((await editAccount(request({ firstName: 'Updated' }), context)).status).toBe(403);
  expect(db.user.update).not.toHaveBeenCalled();
});
