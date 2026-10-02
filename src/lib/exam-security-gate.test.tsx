/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ExamSecurityGate } from '@/components/attempts/ExamSecurityGate';
jest.mock('next/navigation', () => ({ useParams: () => ({ attemptId: 'attempt' }), usePathname: () => '/attempts/attempt/ielts/run' }));
jest.mock('@/components/attempts/ExamIntegrityReview', () => ({ ExamIntegrityReview: () => null }));
let root: Root; let host: HTMLDivElement; let fullscreen: Element | null;
let security: any;
const responses: any[] = [];
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear(); responses.length = 0; fullscreen = null;
  security = { policy: { state: 'PENDING', policyVersion: 1 }, status: 'IN_PROGRESS', hasSpeaking: false, canReview: false };
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreen });
  document.documentElement.requestFullscreen = jest.fn(async () => { fullscreen = document.documentElement; document.dispatchEvent(new Event('fullscreenchange')); });
  globalThis.fetch = jest.fn(async (_url: any, options: any) => {
    if (options?.method === 'POST') { const data = JSON.parse(options.body); responses.push(data); return { ok: true, json: async () => ({ success: true, invalidated: data.event?.kind === 'FULLSCREEN_EXIT' }) } as Response; }
    return { ok: true, json: async () => security } as Response;
  });
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); jest.useRealTimers(); });
const render = async () => { await act(async () => { root.render(<ExamSecurityGate><div>EXAM QUESTIONS</div></ExamSecurityGate>); }); };
const clickText = async (text: string) => { await act(async () => { const button = Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes(text)); expect(button).toBeDefined(); button!.click(); }); };
const preflight = async () => {
  await clickText('Tam ekranı sına');
  await act(async () => { host.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach(box => box.click()); });
};
test('preflight hides questions and disables start until checks and acceptance', async () => {
  await render(); expect(host.textContent).not.toContain('EXAM QUESTIONS');
  const start = Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('tam ekranda başla'))!;
  expect(start.disabled).toBe(true); expect(responses).toHaveLength(0);
});
test('legacy and exempt attempts do not show lockdown', async () => {
  security.policy = null; await render(); expect(host.textContent).toContain('EXAM QUESTIONS'); expect(document.documentElement.requestFullscreen).not.toHaveBeenCalled();
});
test('test-mode fullscreen exit is not a violation', async () => {
  await render(); await clickText('Tam ekranı sına');
  await act(async () => { fullscreen = null; document.dispatchEvent(new Event('fullscreenchange')); });
  expect(responses).toHaveLength(0); expect(host.textContent).not.toContain('İmtahan nəticəsi etibarsızdır');
});
test('successful acceptance mounts exam; fullscreen exit blocks it', async () => {
  await render(); await preflight(); await clickText('tam ekranda başla');
  expect(responses[0].action).toBe('start'); expect(host.textContent).toContain('EXAM QUESTIONS');
  jest.useFakeTimers();
  await act(async () => { fullscreen = null; document.dispatchEvent(new Event('fullscreenchange')); jest.advanceTimersByTime(400); });
  expect(host.textContent).toContain('İmtahan nəticəsi etibarsızdır'); expect(host.textContent).not.toContain('EXAM QUESTIONS');
  expect(responses.some(r => r.event?.kind === 'FULLSCREEN_EXIT')).toBe(true);
});
test('fullscreen rejection never starts the exam', async () => {
  document.documentElement.requestFullscreen = jest.fn(async () => { throw new Error('Denied'); });
  await render(); await clickText('Tam ekranı sına'); expect(host.textContent).not.toContain('EXAM QUESTIONS'); expect(responses).toHaveLength(0);
});
test('successful submit disarms fullscreen exit listener', async () => {
  await render(); await preflight(); await clickText('tam ekranda başla');
  security.status = 'SUBMITTED'; jest.useFakeTimers();
  await act(async () => { window.dispatchEvent(new Event('exam-submitted')); fullscreen = null; document.dispatchEvent(new Event('fullscreenchange')); jest.advanceTimersByTime(400); });
  expect(responses.some(r => r.event?.kind === 'FULLSCREEN_EXIT')).toBe(false);
});
test('pagehide is logged separately without cheating verdict', async () => {
  await render(); await preflight(); await clickText('tam ekranda başla'); jest.useFakeTimers();
  await act(async () => { fullscreen = null; document.dispatchEvent(new Event('fullscreenchange')); window.dispatchEvent(new Event('pagehide')); jest.advanceTimersByTime(400); });
  expect(responses.some(r => r.event?.kind === 'PAGE_LEAVE')).toBe(true); expect(responses.some(r => r.event?.kind === 'FULLSCREEN_EXIT')).toBe(false);
});
test('speaking preflight records a local sample and requires playback confirmation', async () => {
  security.hasSpeaking = true;
  const stop = jest.fn();
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: jest.fn(async () => ({ getTracks: () => [{ stop }] })) } });
  (globalThis as any).MediaRecorder = class {
    state = 'inactive'; mimeType = 'audio/webm'; ondataavailable?: (e: any) => void; onstop?: () => void;
    start() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['sample']) }); this.onstop?.(); }
  };
  URL.createObjectURL = jest.fn(() => 'blob:local-test'); URL.revokeObjectURL = jest.fn();
  await render(); await preflight();
  expect(Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('tam ekranda başla'))!.disabled).toBe(true);
  jest.useFakeTimers(); await clickText('Mikrofonu 3 saniyəlik');
  await act(async () => { jest.advanceTimersByTime(3000); });
  expect(stop).toHaveBeenCalled(); expect(host.querySelector('audio')?.getAttribute('src')).toBe('blob:local-test');
  expect(responses).toHaveLength(0); // The sample is not uploaded.
  await act(async () => { Array.from(host.querySelectorAll('label')).find(l => l.textContent?.includes('Öz səsimi'))!.querySelector('input')!.click(); });
  await clickText('tam ekranda başla'); expect(host.textContent).toContain('EXAM QUESTIONS');
});
test('offline fullscreen exit remains blocked and retries its persisted event', async () => {
  jest.useFakeTimers();
  await render(); await preflight(); await clickText('tam ekranda başla');
  const workingFetch = globalThis.fetch;
  globalThis.fetch = jest.fn(async () => { throw new Error('Offline'); });
  await act(async () => { fullscreen = null; document.dispatchEvent(new Event('fullscreenchange')); jest.advanceTimersByTime(400); });
  expect(host.textContent).toContain('İmtahan nəticəsi etibarsızdır');
  expect(localStorage.getItem('exam-security-events:attempt')).toContain('FULLSCREEN_EXIT');
  globalThis.fetch = workingFetch;
  await act(async () => { jest.advanceTimersByTime(5000); });
  expect(responses.some(r => r.event?.kind === 'FULLSCREEN_EXIT')).toBe(true);
  expect(localStorage.getItem('exam-security-events:attempt')).toBe('[]');
});
