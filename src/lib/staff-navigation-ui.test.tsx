/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import StaffNav from '@/components/dashboard/nav/StaffNav';
import CollapsibleNavSection from '@/components/dashboard/nav/CollapsibleNavSection';
import { Users } from 'lucide-react';
let pathname = '/dashboard/admin/students';
jest.mock('next/navigation', () => ({ usePathname: () => pathname }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ prefetch, ...props }: any) => <a {...props}/> }));
let host: HTMLDivElement, root: Root;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });

test.each(['ADMIN', 'BOSS', 'CREATOR'])('%s highlights only the current Users item across navigation', async role => {
  const base = role === 'CREATOR' ? '/dashboard/creator/students' : '/dashboard/admin/students';
  const routes = [[base, 'Active students'], [base + '/finished', 'Alumni'], [base + '/archive', 'Archive'],
    [base, 'Active students'], ['/dashboard/users/all', 'All users'], ['/dashboard/users/parents', 'Parents'],
    ['/dashboard/users/partners', 'Partners'], ['/dashboard/users/sunday-examiners', 'Sunday examiners']];
  for (const [route, label] of routes) {
    pathname = route;
    await act(async () => root.render(<StaffNav role={role}/>));
    const active = host.querySelectorAll('a[aria-current="page"]');
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toBe(label);
    const highlighted = Array.from(host.querySelectorAll('a')).filter(a => a.style.backgroundColor);
    expect(highlighted).toHaveLength(1);
  }
});

test('CRM stage highlights only its stage, not All contacts', async () => {
  pathname = '/dashboard/crm/stages/ENROLLED';
  await act(async () => root.render(<StaffNav role="ADMIN"/>));
  const active = host.querySelectorAll('a[aria-current="page"]');
  expect(active).toHaveLength(1);
  expect(active[0].textContent).toBe('Joined classes');
});

test('nested links share the section winner and retain detail-page matching', async () => {
  pathname = '/example/child/details';
  await act(async () => root.render(<CollapsibleNavSection isOpen onToggle={() => {}} section={{
    id: 'nested', label: 'Nested', icon: Users, subs: [{ label: 'All', href: '/example' },
      { label: 'Group', children: [{ label: 'Child', href: '/example/child' }] }],
  }}/>));
  const active = host.querySelectorAll('a[aria-current="page"]');
  expect(active).toHaveLength(1);
  expect(active[0].textContent).toBe('Child');
});
