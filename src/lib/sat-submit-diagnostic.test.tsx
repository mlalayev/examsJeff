/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { SatDigitalRunner } from '@/components/attempts/sat/SatDigitalRunner';
import { IeltsDigitalRunner } from '@/components/attempts/ielts/IeltsDigitalRunner';

const replace = jest.fn();
const router = { replace };
jest.mock('next/navigation', () => ({ useRouter: () => router }));
let host: HTMLDivElement;
let root: Root;
const originalFetch = globalThis.fetch;
const payload = { id: 'diagnostic', status: 'IN_PROGRESS', examCategory: 'SAT', examTitle: 'Diagnostic', savedAnswers: {},
  sections: [{ id: 'last', type: 'VOCABULARY', title: 'Math Module 2', order: 0, durationMin: 1,
    questions: [{ id: 'q1', qtype: 'SHORT_TEXT', prompt: { text: '2 + 2?' }, order: 0 }] }] };
beforeEach(() => {
  jest.useFakeTimers(); localStorage.clear(); replace.mockClear();
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  globalThis.fetch = jest.fn(async (url) => ({ ok: true, status: 200, json: async () => String(url).endsWith('/diagnostic') ? payload : {} })) as any;
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); jest.useRealTimers(); globalThis.fetch = originalFetch; });
const button = (label: string) => Array.from(host.querySelectorAll('button')).find(b => b.textContent?.trim() === label)!;
const render = async () => { await act(async () => root.render(<SatDigitalRunner attemptId="diagnostic" />)); };

test.each(['SAT', 'IELTS'])('%s load fails when browser storage is unavailable despite successful API', async category => {
  (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => ({ ...payload, examCategory: category }) });
  const storage = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Storage blocked', 'SecurityError'); });
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  const onLoadError = jest.fn();
  try {
    await act(async () => root.render(category === 'SAT'
      ? <SatDigitalRunner attemptId="diagnostic" onLoadError={onLoadError} />
      : <IeltsDigitalRunner attemptId="diagnostic" onLoadError={onLoadError} />));
    expect(onLoadError).toHaveBeenCalledTimes(1);
  } finally { storage.mockRestore(); log.mockRestore(); }
});

test('before expiry: Submit exam opens confirmation and confirmation sends save then submit', async () => {
  await render();
  await act(async () => button('Submit exam').click());
  expect(host.textContent).toContain('Submit entire exam?');
  await act(async () => button('Submit').click());
  expect((globalThis.fetch as jest.Mock).mock.calls.map(c => c[0])).toEqual([
    '/api/attempts/diagnostic', '/api/attempts/diagnostic/save', '/api/attempts/diagnostic/submit',
  ]);
  expect(replace).toHaveBeenCalledWith('/attempts/diagnostic/results');
});

test('final expiry locks answers but opens submission and allows retry after cancellation', async () => {
  await render();
  await act(async () => jest.advanceTimersByTime(61000));
  expect(host.querySelector('input')?.disabled).toBe(true);
  expect(host.textContent).toContain('Submit entire exam?');
  await act(async () => button('Cancel').click());
  expect(button('Submit exam').disabled).toBe(false);
  await act(async () => button('Submit exam').click());
  await act(async () => button('Submit').click());
  expect(replace).toHaveBeenCalledWith('/attempts/diagnostic/results');
});

test('rejected save prevents submission, retains local answers and can be retried', async () => {
  localStorage.setItem('exam_answers_diagnostic', JSON.stringify({ last: { q1: '4' } }));
  await render();
  (globalThis.fetch as jest.Mock).mockImplementation(async (url: string) => ({ ok: !url.endsWith('/save'), json: async () => ({ error: 'Rate limited' }) }));
  await act(async () => button('Submit exam').click());
  await act(async () => button('Submit').click());
  expect((globalThis.fetch as jest.Mock).mock.calls.some(c => String(c[0]).endsWith('/submit'))).toBe(false);
  expect(replace).not.toHaveBeenCalled();
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('Rate limited');
  expect(JSON.parse(localStorage.getItem('exam_answers_diagnostic')!).last.q1).toBe('4');
  (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
  await act(async () => button('Submit exam').click());
  await act(async () => button('Submit').click());
  expect(replace).toHaveBeenCalledWith('/attempts/diagnostic/results');
  expect(localStorage.getItem('exam_answers_diagnostic')).toBeNull();
});

test('previously stuck attempt reloads at last module and can submit from question one', async () => {
  const sections = ['Verbal Module 1', 'Verbal Module 2', 'Math Module 1', 'Math Module 2'].map((title, i) => ({
    ...payload.sections[0], id: `m${i}`, title, order: i,
    questions: [0, 1].map(j => ({ ...payload.sections[0].questions[0], id: `q${i}_${j}`, order: j })),
  }));
  (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ...payload, sections }) });
  localStorage.setItem('sat_locked_modules_diagnostic', JSON.stringify(sections.map(s => s.id)));
  await render();
  expect(host.textContent).toContain('Module 4 of 4');
  expect(host.querySelector('input')?.disabled).toBe(true);
  expect(localStorage.getItem('sat_timer_diagnostic_m3')).toBeNull();
  expect(host.textContent).toContain('Submit entire exam?');
  await act(async () => button('Cancel').click());
  expect(button('Submit exam').disabled).toBe(false);
  await act(async () => button('Submit exam').click());
  await act(async () => button('Submit').click());
  expect(replace).toHaveBeenCalledWith('/attempts/diagnostic/results');
});

test('submission failure after expiry keeps answers and leaves submit available', async () => {
  localStorage.setItem('exam_answers_diagnostic', JSON.stringify({ last: { q1: '4' } }));
  await render();
  await act(async () => jest.advanceTimersByTime(61000));
  (globalThis.fetch as jest.Mock).mockImplementation(async (url: string) => ({ ok: !url.endsWith('/submit'), json: async () => ({ error: 'Temporary outage' }) }));
  await act(async () => button('Submit').click());
  expect(replace).not.toHaveBeenCalled();
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('Temporary outage');
  expect(button('Submit exam').disabled).toBe(false);
  expect(JSON.parse(localStorage.getItem('exam_answers_diagnostic')!).last.q1).toBe('4');
  (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
  await act(async () => button('Submit exam').click());
  await act(async () => button('Submit').click());
  expect(replace).toHaveBeenCalledWith('/attempts/diagnostic/results');
});

test('reload preserves unsent local answer and scopes saves to each module', async () => {
  const sections = [payload.sections[0], { ...payload.sections[0], id: 'second', order: 1,
    questions: [{ ...payload.sections[0].questions[0], id: 'q2' }] }];
  localStorage.setItem('exam_answers_diagnostic', JSON.stringify({ last: { q1: '4', q2: 'stale' }, second: { q2: '8' } }));
  localStorage.setItem('sat_locked_modules_diagnostic', JSON.stringify(['last', 'second']));
  (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ...payload, sections, savedAnswers: { VOCABULARY: { q1: 'old', q2: 'old' } } }) });
  await render();
  await act(async () => button('Submit').click());
  const saves = (globalThis.fetch as jest.Mock).mock.calls.filter(c => String(c[0]).endsWith('/save'));
  expect(saves.map(c => JSON.parse(c[1].body).answers)).toEqual([{ q1: '4' }, { q2: '8' }]);
});

test('failed module save stays on the module and does not lock it', async () => {
  const sections = [payload.sections[0], { ...payload.sections[0], id: 'second', order: 1 }];
  (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ...payload, sections }) });
  await render();
  (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: 'Save unavailable' }) });
  await act(async () => button('Submit module').click());
  const buttons = Array.from(host.querySelectorAll('button')).filter(b => b.textContent?.trim() === 'Submit module');
  await act(async () => buttons[buttons.length - 1].click());
  expect(host.textContent).toContain('Module 1 of 2');
  expect(host.querySelector('input')?.disabled).toBe(false);
  expect(localStorage.getItem('sat_locked_modules_diagnostic')).toBeNull();
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('Save unavailable');
});


test('final submission waits for the expiry save and ignores duplicate confirmation clicks', async () => {
  await render();
  let release!: (value: any) => void;
  (globalThis.fetch as jest.Mock).mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
  await act(async () => jest.advanceTimersByTime(61000));
  const confirm = button('Submit');
  await act(async () => { confirm.click(); confirm.click(); });
  let calls = (globalThis.fetch as jest.Mock).mock.calls;
  expect(calls.filter(c => String(c[0]).endsWith('/save'))).toHaveLength(1);
  expect(calls.filter(c => String(c[0]).endsWith('/submit'))).toHaveLength(0);
  await act(async () => release({ ok: true, json: async () => ({}) }));
  calls = (globalThis.fetch as jest.Mock).mock.calls;
  expect(calls.filter(c => String(c[0]).endsWith('/save'))).toHaveLength(2);
  expect(calls.filter(c => String(c[0]).endsWith('/submit'))).toHaveLength(1);
  expect(replace).toHaveBeenCalledTimes(1);
});

test('module expiry during a slow manual save advances only once', async () => {
  const sections = [0, 1, 2].map(i => ({ ...payload.sections[0], id: `m${i}`, order: i }));
  (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ...payload, sections }) });
  await render();
  let release!: (value: any) => void;
  (globalThis.fetch as jest.Mock).mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
  await act(async () => button('Submit module').click());
  const confirm = Array.from(host.querySelectorAll('button')).filter(b => b.textContent?.trim() === 'Submit module').pop()!;
  await act(async () => confirm.click());
  await act(async () => jest.advanceTimersByTime(61000));
  expect(host.textContent).toContain('Module 2 of 3');
  await act(async () => release({ ok: true, json: async () => ({}) }));
  expect(host.textContent).toContain('Module 2 of 3');
});
