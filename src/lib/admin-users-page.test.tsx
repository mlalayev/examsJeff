/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import UsersPage from '@/app/dashboard/boss/users/page';
let pathname = '/dashboard/users/all';
jest.mock('next/navigation', () => ({ usePathname: () => pathname }));
jest.mock('@/components/modals/UserDetailsButton', () => () => <button>Profile</button>);
jest.mock('@/components/dashboard/StudentExamsModal', () => ({ open, student }: any) => open ? <div role="dialog">Exams: {student?.id}</div> : null);
jest.mock('@/components/modals/StudentPaymentsModal', () => () => null);
jest.mock('@/components/modals/EditAccountModal', () => () => null);
jest.mock('@/components/modals/CreateUserModal', () => () => null);
let host: HTMLDivElement, root: Root;
const originalFetch = globalThis.fetch;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  globalThis.fetch = jest.fn(async (url: string) => {
    // Admin can list users and branch names, but cannot use the Boss-only endpoint.
    if (url === '/api/admin/branches') return { ok: false, status: 403, json: async () => ({ error: 'Forbidden' }) };
    if (url === '/api/branches') return { ok: true, json: async () => ({ branches: [{ id: 'b', name: 'Main branch' }] }) };
    if (url === '/api/admin/users') return { ok: true, json: async () => ({ users: [
      { id: 's', firstName: 'Test', lastName: 'Student', email: 'student@example.test', role: 'STUDENT', branchId: 'b' },
      { id: 'p', firstName: 'Test', lastName: 'Parent', email: 'parent@example.test', role: 'PARENT', branchId: 'b' },
      { id: 'r', firstName: 'Test', lastName: 'Partner', email: 'partner@example.test', role: 'PARTNER', branchId: 'b' },
    ] }) };
    throw new Error('Unexpected API: ' + url);
  }) as any;
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); globalThis.fetch = originalFetch; });

test.each([['all', 3], ['parents', 1], ['partners', 1]])('Admin can load %s without Boss-only access', async (path, count) => {
  pathname = '/dashboard/users/' + path;
  await act(async () => root.render(<UsersPage/>));
  expect(host.textContent).not.toContain('Could not load users');
  expect(host.querySelectorAll('tbody tr')).toHaveLength(count);
  expect(host.textContent).toContain('Main branch');
  expect((globalThis.fetch as jest.Mock).mock.calls.map(c => c[0])).toEqual(['/api/admin/users', '/api/branches']);
  const table = host.querySelector('tbody')!.textContent!;
  const rows = Array.from(host.querySelectorAll('tbody tr'));
  for (const row of rows) {
    const labels = Array.from(row.querySelectorAll('button')).map(b => b.textContent);
    expect(labels).toEqual(row.textContent?.includes('Test Student') ? ['Profile', 'Edit', 'Payments', 'Exams', 'Delete'] : ['Profile', 'Edit', 'Delete']);
  }
  if (path === 'all') {
    await act(async () => Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Exams')!.click());
    expect(host.querySelector('[role="dialog"]')?.textContent).toBe('Exams: s');
  }
  if (path === 'parents') { expect(table).toContain('Test Parent'); expect(table).not.toContain('Test Student'); }
  if (path === 'partners') { expect(table).toContain('Test Partner'); expect(table).not.toContain('Test Student'); }
});
