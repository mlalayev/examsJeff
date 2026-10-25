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

// Diagnostic reproduction of existing behavior, not a desired product assertion.
test('reproduces dead Submit after final module timer expires', async () => {
  await render();
  await act(async () => jest.advanceTimersByTime(61000));
  expect(button('Submit exam').disabled).toBe(true);
  await act(async () => button('Submit exam').click());
  expect(host.textContent).not.toContain('Submit entire exam?');
  expect((globalThis.fetch as jest.Mock).mock.calls.some(c => String(c[0]).endsWith('/submit'))).toBe(false);
});

test('reproduces submitting despite rejected answer save', async () => {
  await render();
  (globalThis.fetch as jest.Mock).mockImplementation(async (url: string) => ({ ok: !url.endsWith('/save'), json: async () => ({ error: 'Rate limited' }) }));
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    await act(async () => button('Submit exam').click());
    await act(async () => button('Submit').click());
    expect((globalThis.fetch as jest.Mock).mock.calls.some(c => String(c[0]).endsWith('/submit'))).toBe(true);
    expect(replace).toHaveBeenCalledWith('/attempts/diagnostic/results');
  } finally { warn.mockRestore(); }
});
