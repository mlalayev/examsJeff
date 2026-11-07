'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { isTabletDevice, isTerminalSecurityEvent, TABLET_LOCKDOWN_NOTICE, FOCUS_LOSS_GRACE_MS, type MonitoringMode } from '@/lib/exam-device';
import { LOCKDOWN_NOTICE, LOCKDOWN_NOTICE_V2, LOCKDOWN_POLICY_VERSION } from '@/lib/exam-integrity-policy';
import { ExamIntegrityReview } from './ExamIntegrityReview';

type Security = { policy: { state: string; policyVersion: number; monitoringMode?: MonitoringMode } | null; status: string; hasSpeaking: boolean; canReview: boolean };
type Event = { id: string; kind: string; length?: number; field?: string };
export function ExamSecurityGate({ children }: { children: React.ReactNode }) {
  const { attemptId } = useParams<{ attemptId: string }>();
  const path = usePathname();
  const running = path.endsWith('/run');
  const [security, setSecurity] = useState<Security | null>(null);
  const [tablet, setTablet] = useState(false);
  const mode = useRef<MonitoringMode>('FULLSCREEN');
  const policyVersion = useRef(1);
  const [ready, setReady] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [tested, setTested] = useState(false);
  const [mic, setMic] = useState(false);
  const [micTesting, setMicTesting] = useState(false);
  const [micSample, setMicSample] = useState('');
  const testStream = useRef<MediaStream | null>(null);
  const [sound, setSound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(false);
  const active = useRef(false);
  const completed = useRef(false);
  const leaving = useRef(false);
  const queue = useRef<Event[]>([]);
  const flushing = useRef(false);
  const endpoint = `/api/attempts/${attemptId}/integrity`;
  const queueKey = `exam-security-events:${attemptId}`;
  const persist = useCallback(() => { try { localStorage.setItem(queueKey, JSON.stringify(queue.current)); } catch { /* Keep in memory if storage unavailable. */ } }, [queueKey]);
  const flush = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      while (queue.current.length) {
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'event', event: queue.current[0] }), keepalive: true });
        if (!res.ok) break;
        const data = await res.json();
        if (data.invalidated) { setInvalid(true); active.current = false; }
        if (data.ignored && !data.invalidated && isTerminalSecurityEvent(queue.current[0]?.kind, mode.current, policyVersion.current)) setInvalid(false);
        queue.current.shift(); persist();
      }
    } catch { /* Offline events are retried, not converted into cheating. */ }
    finally { flushing.current = false; }
  }, [endpoint, persist]);
  const report = useCallback((kind: string, details: { length?: number; field?: string } = {}) => {
    const event = { id: crypto.randomUUID(), kind, ...details };
    if (queue.current.length < 200 || isTerminalSecurityEvent(kind, mode.current, policyVersion.current)) queue.current.push(event);
    persist(); void flush();
  }, [flush, persist]);
  const load = useCallback(async () => {
    try {
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (!res.ok) throw new Error('İmtahanın təhlükəsizlik vəziyyəti yüklənmədi. Yenidən yoxlayın.');
      const data: Security = await res.json();
      // A poll started before submit may return stale IN_PROGRESS data afterwards.
      if (completed.current) return;
      mode.current = data.policy?.state === 'PENDING'
        ? (isTabletDevice(navigator.userAgent, navigator.maxTouchPoints) ? 'TABLET' : 'FULLSCREEN')
        : data.policy?.monitoringMode || 'FULLSCREEN';
      policyVersion.current = data.policy?.state === 'PENDING' ? LOCKDOWN_POLICY_VERSION : data.policy?.policyVersion || 1;
      setTablet(mode.current === 'TABLET');
      setSecurity(data); setError('');
      if (queue.current.some(e => isTerminalSecurityEvent(e.kind, mode.current, policyVersion.current))) {
        setInvalid(true); active.current = false;
      }
      if (data.policy?.state === 'INVALID') { setInvalid(true); active.current = false; }
      if (data.status !== 'IN_PROGRESS') active.current = false;
    } catch (e) { setError((e as Error).message); }
  }, [endpoint]);
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(queueKey) || '[]'); queue.current = Array.isArray(saved) ? saved.filter(e => e && typeof e.id === 'string' && typeof e.kind === 'string').slice(0, 201) : []; } catch { queue.current = []; }
    if (queue.current.some(e => e.kind === 'FULLSCREEN_EXIT')) setInvalid(true);
    void flush().then(load);
    const timer = setInterval(() => { void flush(); }, 5000);
    return () => clearInterval(timer);
  }, [flush, load, queueKey]);
  useEffect(() => {
    if (!running) { active.current = false; return; }
    let exitTimer: ReturnType<typeof setTimeout> | undefined;
    let focusTimer: ReturnType<typeof setTimeout> | undefined;
    let blurredAt: number | null = null;
    const clearFocus = () => { clearTimeout(focusTimer); focusTimer = undefined; blurredAt = null; };
    const recordExit = (kind: string) => {
      if (!active.current) return;
      if (isTerminalSecurityEvent(kind, mode.current, policyVersion.current)) {
        active.current = false; setInvalid(true); clearFocus();
      }
      report(kind);
    };
    const checkFocus = () => {
      if (blurredAt === null) return;
      // Also evaluate on return: background timers can be throttled by the OS.
      if (Date.now() - blurredAt >= FOCUS_LOSS_GRACE_MS) recordExit('FOCUS_LOST');
      clearFocus();
    };
    const onBlur = (event: globalThis.Event) => {
      if (event.target !== window || !active.current || mode.current === 'TABLET' || policyVersion.current < 2 || blurredAt !== null) return;
      // The document still has focus when the user enters an embedded question.
      if (document.hasFocus()) return;
      blurredAt = Date.now();
      focusTimer = setTimeout(checkFocus, FOCUS_LOSS_GRACE_MS);
      report('WINDOW_BLUR');
    };
    const onFocus = () => { checkFocus(); };

    const onFullscreen = () => {
      if (mode.current === 'TABLET' || !active.current || document.fullscreenElement) return;
      // pagehide distinguishes normal refresh/navigation from an observed exit.
      exitTimer = setTimeout(() => {
        if (leaving.current || !active.current) return;
        recordExit('FULLSCREEN_EXIT');
      }, 350);
    };
    const onLeave = () => {
      leaving.current = true;
      if (exitTimer) clearTimeout(exitTimer);
      clearFocus();
      recordExit('PAGE_LEAVE');
    };
    const onReturn = (e: PageTransitionEvent) => { if (e.persisted) { active.current = false; leaving.current = false; setReady(false); void load(); } };
    const onVisible = () => {
      if (!active.current || !document.hidden) return;
      recordExit('PAGE_HIDDEN');
    };
    const onOffline = () => { if (active.current) report('OFFLINE'); };
    const onComplete = () => {
      clearFocus();
      completed.current = true;
      active.current = false;
      if (exitTimer) clearTimeout(exitTimer);
      // Keep the runner mounted: it still needs to navigate/show its success UI.
      // Never return to preflight after an acknowledged successful submission.
      setSecurity(previous => previous ? { ...previous, status: 'SUBMITTED' } : previous);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
    const onPaste = (e: ClipboardEvent) => {
      if (!active.current || !(e.target instanceof HTMLElement) || !e.target.closest('[data-writing-answer]')) return;
      report('PASTE', { length: Math.min(100000, e.clipboardData?.getData('text').length || 0), field: e.target.getAttribute('name') || e.target.id || 'writing' });
    };
    let lastSnapshot = 0;
    const onInput = (e: globalThis.Event) => {
      if (!active.current || Date.now() - lastSnapshot < 15000 || !(e.target instanceof HTMLTextAreaElement) || !e.target.closest('[data-writing-answer]')) return;
      lastSnapshot = Date.now(); report('WRITING_SNAPSHOT', { length: Math.min(100000, e.target.value.length), field: e.target.name || e.target.id || 'writing' });
    };
    document.addEventListener('fullscreenchange', onFullscreen);
    document.addEventListener('visibilitychange', onVisible);
    document.addEventListener('paste', onPaste, true);
    document.addEventListener('input', onInput, true);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pagehide', onLeave);
    window.addEventListener('pageshow', onReturn);
    window.addEventListener('offline', onOffline);
    window.addEventListener('exam-submitted', onComplete);
    // Includes OS desktop changes while an embedded IELTS question has focus.
    const focusPoll = setInterval(() => {
      if (!active.current || mode.current === 'TABLET' || policyVersion.current < 2) return;
      if (document.hasFocus()) onFocus();
      else onBlur({ target: window } as unknown as globalThis.Event);
    }, 250);
    return () => {
      // Covers in-app navigation where pagehide is not fired.
      leaving.current = true;
      clearFocus();
      clearInterval(focusPoll);
      recordExit('PAGE_LEAVE');
      if (exitTimer) clearTimeout(exitTimer);
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('visibilitychange', onVisible);
      document.removeEventListener('paste', onPaste, true);
      document.removeEventListener('input', onInput, true);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pagehide', onLeave);
      window.removeEventListener('pageshow', onReturn);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('exam-submitted', onComplete);
    };
  }, [running, report, load]);
  useEffect(() => {
    if (!ready || !security?.policy || !running) return;
    const timer = setInterval(() => { void load(); }, 15000);
    return () => clearInterval(timer);
  }, [ready, security?.policy, running, load]);
  useEffect(() => () => { testStream.current?.getTracks().forEach(t => t.stop()); }, []);
  useEffect(() => () => { if (micSample) URL.revokeObjectURL(micSample); }, [micSample]);
  async function testFullscreen() {
    try { await document.documentElement.requestFullscreen(); setTested(true); } catch { setError('Bu brauzerdə tam ekran açıla bilmir. Uyğun desktop brauzerlə yenidən yoxlayın.'); }
  }
  async function testMic() {
    setMicTesting(true); setMic(false); setMicSample('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); testStream.current = stream;
      const recorder = new MediaRecorder(stream); const chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop()); testStream.current = null; setMicTesting(false);
        if (chunks.length) setMicSample(URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })));
        else setError('Test yazısı alınmadı. Mikrofonu yenidən yoxlayın.');
      };
      recorder.start(); setTimeout(() => { if (recorder.state !== 'inactive') recorder.stop(); }, 3000);
    }
    catch { testStream.current?.getTracks().forEach(t => t.stop()); setMicTesting(false); setError('Mikrofon yazısı alınmadı. Brauzer icazələrini yoxlayın.'); }
  }
  async function testSound() {
    try { const context = new AudioContext(); await context.resume(); const oscillator = context.createOscillator(); const gain = context.createGain(); gain.gain.value = 0.08; oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.5); oscillator.onended = () => { void context.close(); }; }
    catch { setError('Səs testi açıla bilmədi. Səs çıxışını yoxlayın.'); }
  }
  async function start() {
    setBusy(true); setError('');
    leaving.current = false;
    try {
      // Must run directly from the user's click, before asynchronous network work.
      if (mode.current === 'FULLSCREEN' && !document.fullscreenElement) await document.documentElement.requestFullscreen();
      await flush();
      if (queue.current.length) throw new Error('Gözləyən hadisələr serverə çatmadı. İnterneti yoxlayıb yenidən cəhd edin.');
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start', accepted: true, policyVersion: policyVersion.current, monitoringMode: mode.current, maxTouchPoints: navigator.maxTouchPoints || 0 }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Başlamaq mümkün olmadı');
      if (data.policyVersion) policyVersion.current = data.policyVersion;
      if (data.monitoringMode) { mode.current = data.monitoringMode; setTablet(mode.current === 'TABLET'); }
      if (mode.current === 'FULLSCREEN' && !document.fullscreenElement) throw new Error('Davam etmək üçün tam ekranı yenidən açın.');
      active.current = true;
      setSecurity(previous => previous?.policy ? { ...previous, policy: { ...previous.policy, state: 'ACTIVE', monitoringMode: mode.current, policyVersion: policyVersion.current } } : previous);
      // The user may have left while the start request was in flight.
      if ((mode.current === 'TABLET' || policyVersion.current >= 2) && (document.hidden || leaving.current)) {
        active.current = false; setInvalid(true); report('PAGE_HIDDEN'); return;
      }
      if (mode.current === 'FULLSCREEN' && policyVersion.current >= 2 && !document.hasFocus()) {
        active.current = false; setError('İmtahan pəncərəsinə qayıdın və başlama düyməsini yenidən basın.'); return;
      }
      setReady(true);
      if (security?.policy?.state === 'ACTIVE') report('RESUMED');
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  if (!security) return <div className="p-8">{error || 'İmtahan yoxlanılır…'}{error && <button onClick={load}>Yenidən yoxla</button>}</div>;
  if (!running) return <><div className="min-w-0 lg:ml-72"><div className="mx-auto max-w-7xl pt-16 lg:pt-4"><ExamIntegrityReview attemptId={attemptId} /></div></div>{security.policy?.state === 'INVALID' && !security.canReview ? null : children}</>;
  if (invalid || security.policy?.state === 'INVALID') return <div className="m-8 rounded-xl border border-red-300 bg-red-50 p-8"><h1 className="text-xl font-bold">İmtahan nəticəsi etibarsızdır</h1><p>Qayda pozuntusu — {tablet ? 'imtahan səhifəsindən çıxış' : policyVersion.current >= 2 ? 'imtahan səhifəsindən və ya tam ekrandan çıxış' : 'fullscreen-dən çıxış'}. Cavablar silinməyib, lakin nəticəyə hesablanmayacaq. Texniki problem olubsa müəlliminizlə əlaqə saxlayın.</p><button onClick={() => { void flush(); void load(); }}>Server vəziyyətini yenidən yoxla</button></div>;
  if (ready) return <><div hidden={completed.current || security.status !== 'IN_PROGRESS'} className="fixed left-1/2 top-0 z-[60] -translate-x-1/2 rounded-b bg-emerald-800 px-3 py-1 text-xs text-white">{tablet ? 'İmtahan səhifəsinə nəzarət aktivdir' : 'Tam ekran və pəncərə nəzarəti aktivdir'}</div>{children}</>;
  if (!security.policy || security.status !== 'IN_PROGRESS') return <>{children}</>;
  return <div className="mx-auto my-8 max-w-2xl space-y-4 rounded-xl border bg-white p-6 text-gray-900">
    <h1 className="text-2xl font-semibold">İmtahandan əvvəl cihaz yoxlaması</h1><p>{tablet ? TABLET_LOCKDOWN_NOTICE : policyVersion.current >= 2 ? LOCKDOWN_NOTICE_V2 : LOCKDOWN_NOTICE}</p>
    <p>Bu cihaz yoxlaması mərhələsində çıxış cəza yaratmır. İlk başlanğıcda sayğac yalnız aşağıdakı başlama düyməsindən sonra işə düşür. Başlanmış imtahana qayıdış sayğacı sıfırlamır.</p>
    <p className="text-sm">Writing cavabları AI dəstəkli müəllim baxışından keçə bilər. İmtahan daxilində paste ölçüləri və yazı uzunluğunun dəyişməsi qeydə alınır; bunlar avtomatik cəza səbəbi deyil.</p>
    {!tablet && <button className="rounded border p-2" onClick={testFullscreen}>{tested ? '✓ Tam ekran yoxlanıb' : 'Tam ekranı sına'}</button>}{' '}
    <button className="rounded border p-2" onClick={testSound}>Test səsini səsləndir</button>
    <label className="block"><input type="checkbox" checked={sound} onChange={e => setSound(e.target.checked)} /> Test səsini eşitdim</label>
    {security.hasSpeaking && <><button className="rounded border p-2" disabled={micTesting} onClick={testMic}>{micTesting ? '3 saniyə danışın — test yazılır…' : 'Mikrofonu 3 saniyəlik yazı ilə yoxla'}</button>{micSample && <><audio controls src={micSample} className="mt-2" /><label className="block"><input type="checkbox" checked={mic} onChange={e => setMic(e.target.checked)} /> Öz səsimi test yazısında eşitdim</label><p className="text-xs">Test yazısı serverə göndərilmir.</p></>}</>}
    <label className="block"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} /> Qaydaları oxudum və qəbul edirəm</label>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <button className="rounded bg-indigo-800 p-3 text-white disabled:opacity-50" disabled={busy || micTesting || !accepted || (!tablet && !tested) || !sound || (security.hasSpeaking && !mic)} onClick={start}>{busy ? 'Başladılır…' : tablet ? 'Qaydaları qəbul edirəm — imtahana başla' : 'Qaydaları qəbul edirəm — tam ekranda başla'}</button>
  </div>;
}
