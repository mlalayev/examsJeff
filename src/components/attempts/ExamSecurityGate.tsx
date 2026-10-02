'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { LOCKDOWN_NOTICE } from '@/lib/exam-integrity-policy';
import { ExamIntegrityReview } from './ExamIntegrityReview';

type Security = { policy: { state: string; policyVersion: number } | null; status: string; hasSpeaking: boolean; canReview: boolean };
type Event = { id: string; kind: string; length?: number; field?: string };
export function ExamSecurityGate({ children }: { children: React.ReactNode }) {
  const { attemptId } = useParams<{ attemptId: string }>();
  const path = usePathname();
  const running = path.endsWith('/run');
  const [security, setSecurity] = useState<Security | null>(null);
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
        if (data.ignored && queue.current[0]?.kind === 'FULLSCREEN_EXIT') setInvalid(false);
        queue.current.shift(); persist();
      }
    } catch { /* Offline events are retried, not converted into cheating. */ }
    finally { flushing.current = false; }
  }, [endpoint, persist]);
  const report = useCallback((kind: string, details: { length?: number; field?: string } = {}) => {
    const event = { id: crypto.randomUUID(), kind, ...details };
    if (queue.current.length < 200 || kind === 'FULLSCREEN_EXIT') queue.current.push(event);
    persist(); void flush();
  }, [flush, persist]);
  const load = useCallback(async () => {
    try {
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (!res.ok) throw new Error('İmtahanın təhlükəsizlik vəziyyəti yüklənmədi. Yenidən yoxlayın.');
      const data: Security = await res.json(); setSecurity(data); setError('');
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
    const onFullscreen = () => {
      if (!active.current || document.fullscreenElement) return;
      // pagehide distinguishes normal refresh/navigation from an observed exit.
      exitTimer = setTimeout(() => {
        if (leaving.current || !active.current) return;
        active.current = false; setInvalid(true); report('FULLSCREEN_EXIT');
      }, 350);
    };
    const onLeave = () => { leaving.current = true; if (exitTimer) clearTimeout(exitTimer); if (active.current) report('PAGE_LEAVE'); };
    const onReturn = (e: PageTransitionEvent) => { if (e.persisted) { active.current = false; leaving.current = false; setReady(false); void load(); } };
    const onVisible = () => { if (active.current && document.hidden) report('PAGE_HIDDEN'); };
    const onOffline = () => { if (active.current) report('OFFLINE'); };
    const onComplete = () => { active.current = false; setReady(false); void load(); };
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
    window.addEventListener('pagehide', onLeave);
    window.addEventListener('pageshow', onReturn);
    window.addEventListener('offline', onOffline);
    window.addEventListener('exam-submitted', onComplete);
    return () => {
      if (exitTimer) clearTimeout(exitTimer);
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('visibilitychange', onVisible);
      document.removeEventListener('paste', onPaste, true);
      document.removeEventListener('input', onInput, true);
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
    try {
      // Must run directly from the user's click, before asynchronous network work.
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      await flush();
      if (queue.current.length) throw new Error('Gözləyən hadisələr serverə çatmadı. İnterneti yoxlayıb yenidən cəhd edin.');
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start', accepted: true, policyVersion: 1 }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Başlamaq mümkün olmadı');
      if (!document.fullscreenElement) throw new Error('Davam etmək üçün tam ekranı yenidən açın.');
      leaving.current = false; active.current = true; setReady(true);
      if (security?.policy?.state === 'ACTIVE') report('RESUMED');
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  if (!security) return <div className="p-8">{error || 'İmtahan yoxlanılır…'}{error && <button onClick={load}>Yenidən yoxla</button>}</div>;
  if (!running) return <><ExamIntegrityReview attemptId={attemptId} />{security.policy?.state === 'INVALID' ? null : children}</>;
  if (invalid || security.policy?.state === 'INVALID') return <div className="m-8 rounded-xl border border-red-300 bg-red-50 p-8"><h1 className="text-xl font-bold">İmtahan nəticəsi etibarsızdır</h1><p>Qayda pozuntusu — fullscreen-dən çıxış. Cavablar silinməyib, lakin nəticəyə hesablanmayacaq. Texniki problem olubsa müəlliminizlə əlaqə saxlayın.</p><button onClick={() => { void flush(); void load(); }}>Server vəziyyətini yenidən yoxla</button></div>;
  if (!security.policy || security.status !== 'IN_PROGRESS') return <>{children}</>;
  if (ready) return <><div className="fixed left-1/2 top-0 z-[60] -translate-x-1/2 rounded-b bg-emerald-800 px-3 py-1 text-xs text-white">Tam ekran nəzarəti aktivdir</div>{children}</>;
  return <div className="mx-auto my-8 max-w-2xl space-y-4 rounded-xl border bg-white p-6 text-gray-900">
    <h1 className="text-2xl font-semibold">İmtahandan əvvəl cihaz yoxlaması</h1><p>{LOCKDOWN_NOTICE}</p>
    <p>Bu yoxlama mərhələsində tam ekrandan çıxmaq cəza yaratmır. İlk başlanğıcda sayğac yalnız aşağıdakı başlama düyməsindən sonra işə düşür. Başlanmış imtahana qayıdış sayğacı sıfırlamır.</p>
    <p className="text-sm">Writing cavabları AI dəstəkli müəllim baxışından keçə bilər. İmtahan daxilində paste ölçüləri və yazı uzunluğunun dəyişməsi qeydə alınır; bunlar avtomatik cəza səbəbi deyil.</p>
    <button className="rounded border p-2" onClick={testFullscreen}>{tested ? '✓ Tam ekran yoxlanıb' : 'Tam ekranı sına'}</button>{' '}
    <button className="rounded border p-2" onClick={testSound}>Test səsini səsləndir</button>
    <label className="block"><input type="checkbox" checked={sound} onChange={e => setSound(e.target.checked)} /> Test səsini eşitdim</label>
    {security.hasSpeaking && <><button className="rounded border p-2" disabled={micTesting} onClick={testMic}>{micTesting ? '3 saniyə danışın — test yazılır…' : 'Mikrofonu 3 saniyəlik yazı ilə yoxla'}</button>{micSample && <><audio controls src={micSample} className="mt-2" /><label className="block"><input type="checkbox" checked={mic} onChange={e => setMic(e.target.checked)} /> Öz səsimi test yazısında eşitdim</label><p className="text-xs">Test yazısı serverə göndərilmir.</p></>}</>}
    <label className="block"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} /> Qaydaları oxudum və qəbul edirəm</label>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <button className="rounded bg-indigo-800 p-3 text-white disabled:opacity-50" disabled={busy || micTesting || !accepted || !tested || !sound || (security.hasSpeaking && !mic)} onClick={start}>{busy ? 'Başladılır…' : 'Qaydaları qəbul edirəm — tam ekranda başla'}</button>
  </div>;
}
