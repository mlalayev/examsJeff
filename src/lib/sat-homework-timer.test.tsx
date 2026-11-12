/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { SatDigitalRunner } from '@/components/attempts/sat/SatDigitalRunner';
const replace = jest.fn();
const router = { replace };
jest.mock('next/navigation', () => ({ useRouter: () => router }));
let root: Root, host: HTMLDivElement;
let isHomework = true;
let extraModules = false;
beforeEach(() => {
  jest.useFakeTimers(); localStorage.clear(); replace.mockClear(); isHomework = true; extraModules = false;
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  globalThis.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({
    id: 'hw', status: 'IN_PROGRESS', examCategory: 'SAT', examTitle: 'Practice', isHomework, savedAnswers: {},
    sections: extraModules ? ['Verbal Module 1', 'Verbal Module 2', 'Math Module 1', 'Math Module 2'].map((title, i) => ({ id: `m${i}`, type: 'VOCABULARY', title, order: i, durationMin: 32, questions: [{ id: `q${i}`, qtype: 'SHORT_TEXT', prompt: { text: 'Question' }, order: 0 }] })) : [{ id: 'module', type: 'VOCABULARY', title: 'Math Module 1', order: 0, durationMin: 1,
      questions: [{ id: 'q', qtype: 'SHORT_TEXT', prompt: { text: '2 + 2?' }, order: 0 }] }],
  }) })) as any;
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); jest.useRealTimers(); });
const render = async () => { await act(async () => root.render(<SatDigitalRunner attemptId="hw" />)); };
const button = (label: string) => Array.from(host.querySelectorAll('button')).find(b => b.textContent?.trim() === label);
test('homework has no timer and remains answerable beyond the old duration', async () => {
  localStorage.setItem('sat_locked_modules_hw', JSON.stringify(['module']));
  localStorage.setItem('sat_timer_hw_module', JSON.stringify({ endTime: Date.now() + 60000 }));
  await render();
  expect(button('Hide')).toBeUndefined();
  expect(localStorage.getItem('sat_timer_hw_module')).toBeNull();
  await act(async () => jest.advanceTimersByTime(120000));
  expect(button('Submit exam')?.disabled).toBe(false);
  expect(host.querySelector('input')?.disabled).toBe(false);
  expect(replace).not.toHaveBeenCalled();
  await act(async () => button('Submit exam')!.click());
  expect(host.textContent).toContain('Submit entire exam?');
  await act(async () => button('Submit')!.click());
  expect((globalThis.fetch as jest.Mock).mock.calls.some(c => String(c[0]).endsWith('/submit'))).toBe(true);
});
test('normal SAT exams still create and display their timer', async () => {
  isHomework = false;
  await render();
  expect(button('Hide')).toBeDefined();
  expect(localStorage.getItem('sat_timer_hw_module')).not.toBeNull();
  expect(host.textContent).toContain('1:00');
});


test('Verbal 2 opens a persistent ten-minute break, then advances without saving a synthetic section', async () => {
  isHomework = false; extraModules = true;
  localStorage.setItem('sat_locked_modules_hw', JSON.stringify(['m0', 'm1']));
  await render();
  expect(host.textContent).toContain('10:00');
  await act(async () => jest.advanceTimersByTime(60000));
  expect(host.textContent).toContain('9:00');
  await act(async () => root.unmount()); root = createRoot(host);
  await render();
  expect(host.textContent).toContain('9:00');
  await act(async () => jest.advanceTimersByTime(540000));
  expect(host.textContent).toContain('Math Module 1');
  expect(host.textContent).toContain('Module 3 of 4');
  expect((globalThis.fetch as jest.Mock).mock.calls.some(c => String(c[0]).endsWith('/save'))).toBe(false);
  await act(async () => root.unmount()); root = createRoot(host);
  await render();
  expect(host.textContent).toContain('Module 3 of 4');
});
