'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

/** Account + editor + entity scoped. Restore before writing; never erase on failed save. */
export function useExamDraft<T extends Record<string, unknown>>(scope: string, value: T, restore: (value: T) => void) {
  const { data: session, status } = useSession();
  const key = session?.user?.id ? `exam-draft:v1:${session.user.id}:${scope}` : null;
  const latest = useRef(value); latest.current = value;
  const restoreRef = useRef(restore); restoreRef.current = restore;
  const initialized = useRef<string | null>(null);
  const stopped = useRef(false);
  const stored = useRef<string | null>(null);
  const skipWrite = useRef(false);
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const write = () => {
    if (!key || initialized.current !== key || stopped.current) return;
    try {
      if (localStorage.getItem(key) !== stored.current) {
        stopped.current = true; setFailed(true); setMessage('Bu draft başqa tabda dəyişdirilib. Üzərinə yazılmadı; işinizi serverə saxlayın və ya digər tabı yoxlayın.'); return;
      }
      const serialized = JSON.stringify({ version: 1, data: latest.current });
      localStorage.setItem(key, serialized); stored.current = serialized;
      setFailed(false); setMessage('Draft bu brauzerdə saxlanılıb.');
    } catch { setFailed(true); setMessage('Draft saxlanmadı: brauzer yaddaşı doludur və ya bağlıdır. Səhifəni bağlamadan Save exam edin.'); }
  };
  const writeRef = useRef(write); writeRef.current = write;
  useEffect(() => {
    if (!key) { if (status !== 'loading') { setReady(true); setFailed(true); setMessage('Draft üçün istifadəçi sessiyası tapılmadı.'); } return; }
    if (initialized.current === key) return;
    initialized.current = key; stopped.current = false; skipWrite.current = true;
    try {
      const raw = localStorage.getItem(key);
      stored.current = raw;
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.version !== 1 || !saved.data || Object.keys(value).some(k => !(k in saved.data))) throw new Error('Invalid draft');
        if ('sections' in value && (!Array.isArray(saved.data.sections) || saved.data.sections.some((s: any) => !s || typeof s.id !== 'string' || !Array.isArray(s.questions)))) throw new Error('Invalid sections');
        restoreRef.current(saved.data); setMessage('Saxlanmamış draft bərpa edildi.');
      }
    } catch { stopped.current = true; setFailed(true); setMessage('Draft oxuna bilmədi. Köhnə məlumatın üzərinə yazılmır; bu səhifəni bağlamadan imtahanı serverə saxlayın.'); }
    setReady(true);
  }, [key, status]);
  useEffect(() => {
    if (!ready) return;
    if (skipWrite.current) { skipWrite.current = false; return; }
    writeRef.current();
  }, [value, ready]);
  useEffect(() => {
    const flush = () => writeRef.current();
    const before = (e: BeforeUnloadEvent) => { flush(); if (failed) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('pagehide', flush); window.addEventListener('beforeunload', before);
    return () => { window.removeEventListener('pagehide', flush); window.removeEventListener('beforeunload', before); };
  }, [failed]);
  function clear() {
    // Edits made while the request was in flight are not part of that saved payload.
    if (JSON.stringify(latest.current) !== JSON.stringify(value)) { writeRef.current(); return; }
    stopped.current = true;
    if (key) { try { if (localStorage.getItem(key) === stored.current) localStorage.removeItem(key); } catch { setFailed(true); setMessage('İmtahan saxlandı, amma lokal draft silinmədi.'); } }
  }
  const notice = <p role="status" className={`my-2 text-sm ${failed ? 'text-red-700' : 'text-slate-600'}`}>{message || 'Draft hazırlanır…'}</p>;
  return { clear, ready, notice };
}
