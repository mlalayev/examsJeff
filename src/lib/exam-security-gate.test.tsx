/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ExamSecurityGate } from '@/components/attempts/ExamSecurityGate';
import { ExamNotice } from '@/components/attempts/ExamNotice';
import { showExamNotice } from '@/lib/exam-notice';
import { FOCUS_LOSS_GRACE_MS } from './exam-device';
jest.mock('next/navigation', () => ({ useParams: () => ({ attemptId: 'attempt' }), usePathname: () => '/attempts/attempt/ielts/run' }));
jest.mock('@/components/attempts/ExamIntegrityReview', () => ({ ExamIntegrityReview: () => null }));
let root: Root; let host: HTMLDivElement; let fullscreen: Element | null;
let security: any;
const responses: any[] = [];
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear(); responses.length = 0; fullscreen = null;
  Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Windows Chrome' });
  Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 0 });
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  Object.defineProperty(document, 'hasFocus', { configurable: true, value: jest.fn(() => true) });
  security = { policy: { state: 'PENDING', policyVersion: 1 }, status: 'IN_PROGRESS', hasSpeaking: false, canReview: false };
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreen });
  document.documentElement.requestFullscreen = jest.fn(async () => { fullscreen = document.documentElement; document.dispatchEvent(new Event('fullscreenchange')); });
  document.exitFullscreen = jest.fn(async () => { fullscreen = null; document.dispatchEvent(new Event('fullscreenchange')); });
  globalThis.fetch = jest.fn(async (_url: any, options: any) => {
    if (options?.method === 'POST') { const data = JSON.parse(options.body); responses.push(data); if (data.action === 'start') security = { ...security, policy: { ...security.policy, state: 'ACTIVE', policyVersion: data.policyVersion, monitoringMode: security.policy?.monitoringMode || data.monitoringMode } }; return { ok: true, json: async () => ({ success: true, invalidated: data.event?.kind === 'FULLSCREEN_EXIT' }) } as Response; }
    return { ok: true, json: async () => security } as Response;
  });
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); jest.useRealTimers(); });
const render = async () => { await act(async () => { root.render(<ExamSecurityGate><div>EXAM QUESTIONS</div></ExamSecurityGate>); }); };

const tabletPreflight = async () => {
  Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari' });
  Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 5 });
  await render();
  await act(async () => { host.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach(box => box.click()); });
};
const hidePage = async () => {
  await act(async () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
};
test('tablet starts without fullscreen and tab switch immediately blocks questions', async () => {
  await tabletPreflight();
  expect(host.textContent).not.toContain('Tam ekranı sına');
  await clickText('imtahana başla');
  expect(document.documentElement.requestFullscreen).not.toHaveBeenCalled();
  expect(responses[0].monitoringMode).toBe('TABLET');
  expect(host.textContent).toContain('EXAM QUESTIONS');
  await hidePage();
  expect(host.textContent).not.toContain('EXAM QUESTIONS');
  expect(host.textContent).toContain('imtahan səhifəsindən çıxış');
  expect(responses.some(r => r.event?.kind === 'PAGE_HIDDEN')).toBe(true);
});
test('tablet preflight and successful submission do not penalize tab switches', async () => {
  await tabletPreflight(); await hidePage();
  expect(responses).toHaveLength(0);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  await clickText('imtahana başla');
  await act(async () => { window.dispatchEvent(new Event('exam-submitted')); });
  await hidePage();
  await act(async () => { window.dispatchEvent(new Event('pagehide')); });
  expect(responses.filter(r => r.action === 'event')).toHaveLength(0);
  expect(host.textContent).toContain('EXAM QUESTIONS');
});
test('tablet navigation invalidates and offline evidence is persisted', async () => {
  await tabletPreflight(); await clickText('imtahana başla');
  globalThis.fetch = jest.fn(async () => { throw new Error('Offline'); });
  await act(async () => { window.dispatchEvent(new Event('pagehide')); });
  expect(host.textContent).toContain('İmtahan nəticəsi etibarsızdır');
  expect(localStorage.getItem('exam-security-events:attempt')).toContain('PAGE_LEAVE');
});
test('tablet resize, keyboard focus and fullscreen changes are not violations', async () => {
  await tabletPreflight(); await clickText('imtahana başla');
  await act(async () => {
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('blur'));
    document.dispatchEvent(new Event('fullscreenchange'));
  });
  expect(responses.filter(r => r.action === 'event')).toHaveLength(0);
  expect(host.textContent).toContain('EXAM QUESTIONS');
});
test('existing fullscreen attempts retain their mode on tablets', async () => {
  security.policy.state = 'ACTIVE'; security.policy.monitoringMode = 'FULLSCREEN';
  await tabletPreflight();
  expect(host.textContent).toContain('Tam ekranı sına');
  expect(host.textContent).not.toContain('Planşetdə tam ekran tələb olunmur');
});
test('queued tablet exit still blocks after reload when the event cannot reach the server', async () => {
  security.policy = { state: 'ACTIVE', policyVersion: 1, monitoringMode: 'TABLET' };
  localStorage.setItem('exam-security-events:attempt', JSON.stringify([{ id: 'offline-exit', kind: 'PAGE_HIDDEN' }]));
  const workingFetch = globalThis.fetch;
  globalThis.fetch = jest.fn(async (url: any, options: any) => {
    if (options?.method === 'POST') throw new Error('Offline');
    return workingFetch(url, options);
  });
  await render();
  expect(host.textContent).toContain('İmtahan nəticəsi etibarsızdır');
  expect(host.textContent).not.toContain('EXAM QUESTIONS');
});
test('tablet in-app navigation records the exit on unmount', async () => {
  await tabletPreflight(); await clickText('imtahana başla');
  await act(async () => { root.render(<div>Another page</div>); });
  expect(responses.some(r => r.event?.kind === 'PAGE_LEAVE')).toBe(true);
});
test('save error notice stays inside fullscreen without a native alert', async () => {
  const nativeAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
  fullscreen = document.documentElement;
  await act(async () => { root.render(<ExamNotice />); });
  await act(async () => { showExamNotice('Answers could not be saved. Please retry.'); });
  expect(host.querySelector('[role="alertdialog"]')?.textContent).toContain('Answers could not be saved');
  expect(nativeAlert).not.toHaveBeenCalled();
  expect(document.fullscreenElement).toBe(document.documentElement);
  await act(async () => { host.querySelector('button')!.click(); });
  expect(host.querySelector('[role="alertdialog"]')).toBeNull();
  nativeAlert.mockRestore();
});
const clickText = async (text: string) => { await act(async () => { const button = Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes(text)); expect(button).toBeDefined(); button!.click(); }); };
const preflight = async () => {
  await clickText('Tam ekranı sına');
  await act(async () => { host.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach(box => box.click()); });
};

test('new desktop policy blocks hidden pages even while fullscreen stays active', async () => {
  await render(); await preflight(); await clickText('tam ekranda başla');
  expect(responses[0].policyVersion).toBe(2);
  await hidePage();
  expect(document.fullscreenElement).not.toBeNull();
  expect(host.textContent).not.toContain('EXAM QUESTIONS');
  expect(responses.some(r => r.event?.kind === 'PAGE_HIDDEN')).toBe(true);
});

test('desktop focus loss blocks without a visibility or fullscreen event', async () => {
  jest.useFakeTimers();
  await render(); await preflight(); await clickText('tam ekranda başla');
  await act(async () => {
    (document.hasFocus as jest.Mock).mockReturnValue(false);
    window.dispatchEvent(new Event('blur'));
    jest.advanceTimersByTime(FOCUS_LOSS_GRACE_MS + 10);
  });
  expect(document.hidden).toBe(false);
  expect(document.fullscreenElement).not.toBeNull();
  expect(responses.filter(r => r.event?.kind === 'FOCUS_LOST')).toHaveLength(1);
  expect(host.textContent).not.toContain('EXAM QUESTIONS');
});

test('polling detects focus loss while an iframe owns focus without window blur', async () => {
  jest.useFakeTimers();
  await render(); await preflight(); await clickText('tam ekranda başla');
  await act(async () => {
    (document.hasFocus as jest.Mock).mockReturnValue(false);
    jest.advanceTimersByTime(FOCUS_LOSS_GRACE_MS + 500);
  });
  expect(responses.some(r => r.event?.kind === 'FOCUS_LOST')).toBe(true);
});

test('brief focus loss and focusing an embedded question do not invalidate', async () => {
  jest.useFakeTimers();
  await render(); await preflight(); await clickText('tam ekranda başla');
  await act(async () => {
    (document.hasFocus as jest.Mock).mockReturnValue(false);
    window.dispatchEvent(new Event('blur'));
    jest.advanceTimersByTime(200);
    (document.hasFocus as jest.Mock).mockReturnValue(true);
    window.dispatchEvent(new Event('focus'));
    // Parent window blur while focus remains inside the document/iframe.
    window.dispatchEvent(new Event('blur'));
    jest.advanceTimersByTime(2000);
  });
  expect(responses.some(r => r.event?.kind === 'FOCUS_LOST')).toBe(false);
  expect(host.textContent).toContain('EXAM QUESTIONS');
});

test('return detects a long focus loss even if background timers never fired', async () => {
  jest.useFakeTimers();
  await render(); await preflight(); await clickText('tam ekranda başla');
  await act(async () => {
    (document.hasFocus as jest.Mock).mockReturnValue(false);
    window.dispatchEvent(new Event('blur'));
    jest.setSystemTime(Date.now() + 3000);
    (document.hasFocus as jest.Mock).mockReturnValue(true);
    window.dispatchEvent(new Event('focus'));
  });
  expect(responses.some(r => r.event?.kind === 'FOCUS_LOST')).toBe(true);
});

test('submit cancels pending focus checks and ignores subsequent hidden and leave events', async () => {
  jest.useFakeTimers();
  await render(); await preflight(); await clickText('tam ekranda başla');
  await act(async () => {
    (document.hasFocus as jest.Mock).mockReturnValue(false);
    window.dispatchEvent(new Event('blur'));
    window.dispatchEvent(new Event('exam-submitted'));
    window.dispatchEvent(new Event('pagehide'));
    jest.advanceTimersByTime(3000);
  });
  await hidePage();
  expect(responses.some(r => ['FOCUS_LOST', 'FULLSCREEN_EXIT', 'PAGE_HIDDEN', 'PAGE_LEAVE'].includes(r.event?.kind))).toBe(false);
  expect(host.textContent).toContain('EXAM QUESTIONS');
});

test('preflight permission focus changes and active legacy attempts are not newly penalized', async () => {
  jest.useFakeTimers();
  security.policy = { state: 'ACTIVE', policyVersion: 1, monitoringMode: 'FULLSCREEN' };
  await render();
  await act(async () => { window.dispatchEvent(new Event('blur')); jest.advanceTimersByTime(3000); });
  expect(responses).toHaveLength(0);
  await preflight(); await clickText('tam ekranda başla');
  await hidePage();
  await act(async () => {
    (document.hasFocus as jest.Mock).mockReturnValue(false);
    window.dispatchEvent(new Event('blur'));
    jest.advanceTimersByTime(3000);
  });
  expect(responses[0].policyVersion).toBe(1);
  expect(responses.some(r => r.event?.kind === 'FOCUS_LOST')).toBe(false);
  expect(host.textContent).toContain('EXAM QUESTIONS');
});

test('offline desktop visibility violation survives reload with the persisted policy', async () => {
  security.policy = { state: 'ACTIVE', policyVersion: 2, monitoringMode: 'FULLSCREEN' };
  localStorage.setItem('exam-security-events:attempt', JSON.stringify([{ id: 'hidden-offline', kind: 'PAGE_HIDDEN' }]));
  const workingFetch = globalThis.fetch;
  globalThis.fetch = jest.fn(async (url: any, options: any) => {
    if (options?.method === 'POST') throw new Error('Offline');
    return workingFetch(url, options);
  });
  await render();
  expect(host.textContent).not.toContain('EXAM QUESTIONS');
  expect(host.textContent).toContain('İmtahan nəticəsi etibarsızdır');
});
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
test('acknowledged submit preserves runner and ignores stale server status', async () => {
  await render(); await preflight(); await clickText('tam ekranda başla');
  // Server mock still returns IN_PROGRESS: completion must be authoritative locally.
  await act(async () => { window.dispatchEvent(new Event('exam-submitted')); });
  expect(host.textContent).toContain('EXAM QUESTIONS');
  expect(host.textContent).not.toContain('İmtahandan əvvəl cihaz yoxlaması');
  expect(document.exitFullscreen).toHaveBeenCalled();
  expect(responses.some(r => r.event?.kind === 'FULLSCREEN_EXIT')).toBe(false);
});
test('legacy pagehide is logged separately without cheating verdict', async () => {
  security.policy = { state: 'ACTIVE', policyVersion: 1, monitoringMode: 'FULLSCREEN' };
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
