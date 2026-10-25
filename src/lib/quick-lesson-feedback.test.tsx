/** @jest-environment jsdom */
import React, { act, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import QuickLessonFeedback, { FeedbackRow } from '@/components/teacher/QuickLessonFeedback';
let host: HTMLDivElement; let root: Root; let latest: FeedbackRow[];
const initial: FeedbackRow[] = ['Ali', 'Leyla', 'Samir'].map((name, i) => ({ studentId: String(i), name, attendance: i === 1 ? 'ABSENT' : 'PRESENT', lateMinutes: '', performance: '', homeworkStatus: 'NOT_ASSIGNED', feedback: i === 0 ? 'Keep this note' : '', behaviorNote: '' }));
function Harness() { const [rows, setRows] = useState(initial); latest = rows; return <QuickLessonFeedback rows={rows} onChange={(id,patch) => setRows(prev => prev.map(r => r.studentId === id ? {...r,...patch} : r))} onBulkChange={(ids,patch) => setRows(prev => prev.map(r => ids.includes(r.studentId) ? {...r,...patch} : r))} onRemove={jest.fn()} />; }
beforeEach(async () => { (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.append(host); root = createRoot(host); await act(async () => root.render(<Harness />)); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
const click = async (label: string) => { const el = Array.from(host.querySelectorAll<HTMLElement>('button,input')).find(e => e.getAttribute('aria-label') === label || e.textContent === label)!; expect(el).toBeDefined(); await act(async () => el.click()); };
const select = async (label: string, value: string) => { const el = host.querySelector<HTMLSelectElement>(`[aria-label="${label}"]`)!; await act(async () => { el.value = value; el.dispatchEvent(new Event('change', {bubbles:true})); }); };
test('Update all changes chosen fields and preserves existing notes and attendance', async () => {
  expect(host.querySelector('input[type=checkbox]')).toBeNull();
  await click('Update all');
  await select('All students performance', 'GOOD'); await select('All students homework', 'COMPLETED'); await click('Apply to all');
  expect(latest.map(r => r.performance)).toEqual(['GOOD','GOOD','GOOD']);
  expect(latest.map(r => r.homeworkStatus)).toEqual(['COMPLETED','COMPLETED','COMPLETED']);
  expect(latest[1].attendance).toBe('ABSENT'); expect(latest[0].feedback).toBe('Keep this note');
  expect(host.querySelector('[role="status"]')?.textContent).toContain('Save lesson');
});
test('notes and late minutes appear only when requested; individual corrections remain possible', async () => {
  expect(host.querySelector('textarea')).toBeNull();
  await click('Edit notes'); expect(host.querySelector<HTMLTextAreaElement>('[aria-label="Ali: feedback"]')?.value).toBe('Keep this note');
  await click('Ali: late'); expect(host.querySelector('[aria-label="Ali: late minutes"]')).not.toBeNull();
  await click('Ali: present'); expect(host.querySelector('[aria-label="Ali: late minutes"]')).toBeNull();
  expect(latest[0].feedback).toBe('Keep this note');
});
