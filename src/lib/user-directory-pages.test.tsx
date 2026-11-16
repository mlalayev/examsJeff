/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import StudentLifecycleDashboard from '@/components/dashboard/StudentLifecycleDashboard';
import ExamCandidatesDashboard from '@/components/dashboard/ExamCandidatesDashboard';
import AdminStudents from '@/app/dashboard/admin/students/page';
import CreatorStudents from '@/app/dashboard/creator/students/page';

jest.mock('next/navigation', () => ({ usePathname: () => '/dashboard/admin/students' }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ prefetch, ...props }: any) => <a {...props}/> }));
jest.mock('@/components/modals/UserDetailsButton', () => () => <button>Profile</button>);
jest.mock('@/components/modals/EditAccountModal', () => ({ open, userId }: any) => open ? <div role="dialog">Edit: {userId}</div> : null);
jest.mock('@/components/modals/StudentPaymentsModal', () => ({ open, studentId }: any) => open ? <div role="dialog">Payments: {studentId}</div> : null);
jest.mock('@/components/dashboard/StudentExamsModal', () => ({ open, student }: any) => open ? <div role="dialog">Exams: {student?.id}</div> : null);
jest.mock('@/components/coins/ManualCoinModal', () => () => null);
jest.mock('@/hooks/useStudentSubmittedExamIds', () => ({ useStudentSubmittedExamIds: () => ({ submittedExamIds: new Set(), loading: false }) }));

let host: HTMLDivElement, root: Root;
const originalFetch = globalThis.fetch;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  globalThis.fetch = jest.fn(async (url: string) => ({ ok: true, json: async () => String(url).startsWith('/api/admin/students?') ? { students: [{
    id: 'student', name: 'Test Student', email: 'test@example.test', approved: true, createdAt: '2026-11-13T10:00:00Z',
    studyTypes: ['GENERAL_ENGLISH'], program: 'General English', branch: { id: 'b', name: 'Main' }, monthlyFee: 0,
    currentMonth: { status: 'PAID', amount: 0 },
  }] } : String(url) === '/api/branches' ? { branches: [] } : { exams: [] } })) as any;
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); globalThis.fetch = originalFetch; });

const pages = {
  admin: <AdminStudents/>, creator: <CreatorStudents/>,
  alumni: <StudentLifecycleDashboard bucket="FINISHED" studentsListHref="/dashboard/admin/students"/>,
  archive: <StudentLifecycleDashboard bucket="ARCHIVED" studentsListHref="/dashboard/admin/students"/>,
  candidates: <ExamCandidatesDashboard studentsListHref="/dashboard/admin/students"/>,
};

test.each(Object.keys(pages))('%s renders the shared directory and keeps Exams working', async kind => {
  await act(async () => root.render(pages[kind as keyof typeof pages]));
  const table = host.querySelector('table[aria-label="User directory"]')!;
  expect(table).not.toBeNull();
  expect(Array.from(table.querySelectorAll('th')).map(h => h.textContent)).toEqual(['User', 'Program', 'Branch', 'Monthly fee', 'Status', 'Joined', 'Actions']);
  expect(table.querySelectorAll('tbody tr')).toHaveLength(1);
  expect(table.textContent).toContain('test@example.test');
  expect(table.textContent).toContain('0.00 AZN');
  const button = Array.from(table.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Exams')!;
  await act(async () => button.click());
  expect(host.querySelector('[role="dialog"]')?.textContent).toBe('Exams: student');
});

test.each(['alumni', 'archive', 'candidates'])('%s retains Edit and Payments modals', async kind => {
  await act(async () => root.render(pages[kind as keyof typeof pages]));
  for (const label of ['Edit', 'Payments']) {
    const button = Array.from(host.querySelectorAll('button')).find(b => b.textContent?.trim() === label)!;
    await act(async () => button.click());
    expect(Array.from(host.querySelectorAll('[role="dialog"]')).some(d => d.textContent === label + ': student')).toBe(true);
  }
});
