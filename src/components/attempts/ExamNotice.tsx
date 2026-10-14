'use client';
import { useEffect, useState } from 'react';

export function ExamNotice() {
  const [message, setMessage] = useState('');
  useEffect(() => {
    const receive = (event: Event) => setMessage(String((event as CustomEvent).detail || ''));
    window.addEventListener('exam-notice', receive);
    return () => window.removeEventListener('exam-notice', receive);
  }, []);
  if (!message) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
    <div role="alertdialog" aria-modal="true" aria-labelledby="exam-notice-title" aria-describedby="exam-notice-message" className="w-full max-w-lg rounded-xl bg-white p-6 text-slate-900 shadow-xl">
      <h2 id="exam-notice-title" className="text-lg font-semibold">İmtahan bildirişi</h2>
      <p id="exam-notice-message" className="my-4 whitespace-pre-wrap">{message}</p>
      <button autoFocus className="rounded bg-blue-600 px-5 py-2 text-white" onClick={() => setMessage('')}>OK</button>
    </div>
  </div>;
}
