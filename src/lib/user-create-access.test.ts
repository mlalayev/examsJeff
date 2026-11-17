jest.mock('@/lib/prisma', () => ({ prisma: {
  user: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
  $transaction: jest.fn(),
} }));
jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/user-password', () => ({ preparePasswordForStorage: jest.fn() }));
jest.mock('@/lib/student-enrollment', () => ({
  ...jest.requireActual('./student-enrollment'), enrollStudent: jest.fn(),
}));

import { getServerSession } from 'next-auth/next';
import { prisma } from './prisma';
import { preparePasswordForStorage } from './user-password';
import { enrollStudent } from './student-enrollment';
import { POST } from '@/app/api/admin/users/create/route';

const db = prisma as any;
const session = getServerSession as jest.Mock;
const payload = {
  firstName: 'Test', lastName: 'Account', email: 'new@example.test',
  password: 'test-password-only', role: 'ADMIN', branchId: 'branch', approved: true,
};
const request = (overrides = {}) => new Request('http://localhost/api/admin/users/create', {
  method: 'POST', body: JSON.stringify({ ...payload, ...overrides }),
});

beforeEach(() => {
  jest.clearAllMocks();
  session.mockResolvedValue({ user: { id: 'creator', role: 'CREATOR' } });
  db.user.findUnique.mockResolvedValue(null);
  db.user.findMany.mockResolvedValue([{ id: 'child' }]);
  db.user.create.mockImplementation(async ({ data }: any) => ({
    id: 'new-user', role: data.role, branchId: data.branchId,
  }));
  db.$transaction.mockImplementation(async (run: any) => run(db));
  (preparePasswordForStorage as jest.Mock).mockResolvedValue({
    passwordHash: 'test-hash', passwordEncrypted: 'test-encrypted',
  });
});

test.each(['STUDENT', 'TEACHER', 'ADMIN', 'PARENT', 'PARTNER'])(
  'Creator can create %s from the shared modal', async role => {
    const response = await POST(request({ role, childIds: ['child'] }));
    expect(response.status).toBe(201);
    expect(db.user.create.mock.calls[0][0].data).toMatchObject({
      role, passwordHash: 'test-hash', passwordEncrypted: 'test-encrypted',
    });
    expect(db.user.create.mock.calls[0][0].data).not.toHaveProperty('password');
    expect(await response.json()).not.toHaveProperty('user.passwordHash');
    expect(enrollStudent).toHaveBeenCalledWith(db, 'new-user', role,
      role === 'PARTNER' ? null : 'branch', [], undefined);
  },
);

test.each(['ADMIN', 'BOSS'])('retains %s account creation access', async role => {
  session.mockResolvedValue({ user: { id: 'staff', role } });
  expect((await POST(request())).status).toBe(201);
});

test.each(['STUDENT', 'TEACHER', 'PARENT', 'PARTNER', 'BRANCH_ADMIN', 'BRANCH_BOSS'])(
  '%s cannot create an admin', async role => {
    session.mockResolvedValue({ user: { id: 'other', role } });
    expect((await POST(request())).status).toBe(403);
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  },
);

test('partner-specific access rules still apply', async () => {
  session.mockResolvedValue({ user: { id: 'branch-admin', role: 'BRANCH_ADMIN' } });
  expect((await POST(request({ role: 'PARTNER' }))).status).toBe(201);
  session.mockResolvedValue({ user: { id: 'teacher', role: 'TEACHER' } });
  expect((await POST(request({ role: 'PARTNER' }))).status).toBe(403);
});

test.each(['CREATOR', 'BOSS', 'BRANCH_ADMIN', 'BRANCH_BOSS'])(
  'shared endpoint does not expose privileged %s creation', async role => {
    expect((await POST(request({ role }))).status).toBe(400);
    expect(db.$transaction).not.toHaveBeenCalled();
  },
);

test('duplicate emails are rejected without creating an account', async () => {
  db.user.findUnique.mockResolvedValue({ id: 'existing' });
  expect((await POST(request())).status).toBe(400);
  expect(db.$transaction).not.toHaveBeenCalled();
});

test('student and parent requirements remain enforced for Creator', async () => {
  expect((await POST(request({ role: 'STUDENT', branchId: null }))).status).toBe(400);
  expect((await POST(request({ role: 'PARENT' }))).status).toBe(400);
  expect(db.$transaction).not.toHaveBeenCalled();
});
