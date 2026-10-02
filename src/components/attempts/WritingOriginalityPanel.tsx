'use client';
import { useCallback, useEffect, useState } from 'react';
export function WritingOriginalityPanel({ attemptId }: { attemptId: string }) {
  const [review, setReview] = useState<any>(null);
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endpoint = `/api/attempts/${attemptId}/writing/originality`;
  const load = useCallback(async () => { try { const r = await fetch(endpoint); if (r.ok) { const data = await r.json(); setAvailable(data.hasWriting); setReview(data.review); } } catch {} }, [endpoint]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (review?.state !== 'CHECKING') return; const timer = setInterval(() => { void load(); }, 5000); return () => clearInterval(timer); }, [review?.state, load]);
  if (!available) return null;
  async function check() {
    setBusy(true); setError('');
    try { const r = await fetch(endpoint, { method: 'POST' }); const data = await r.json(); if (!r.ok) throw new Error(data.error); setReview(data.review); }
    catch (e) { setError((e as Error).message); await load(); } finally { setBusy(false); }
  }
  const labels: Record<string, string> = { NOT_CHECKED: 'Yoxlanmayıb', CHECKING: 'Yoxlanır', FAILED: 'Yoxlama alınmadı', REVIEW_REQUIRED: 'Müəllim baxışı lazımdır', INSUFFICIENT_EVIDENCE: 'Müəllifliyi müəyyən etmək üçün kifayət qədər dəlil yoxdur' };
  return <section className="my-4 rounded-lg border bg-white p-4 text-gray-900"><h2 className="font-semibold">Writing AI checker — müəllimə köməkçi baxış</h2>
    <p className="text-sm">Bu alət AI müəllifliyini sübut etmir, AI faizi hesablamır və qiyməti dəyişmir. Mətn və brauzer siqnalları yanlış şübhə yarada bilər. Qərarı müəllim ayrıca araşdırmalıdır.</p>
    <p role="status">{busy ? 'Yoxlanır…' : labels[review?.state || 'NOT_CHECKED']}</p>
    <button className="my-2 rounded border p-2 disabled:opacity-50" disabled={busy || review?.state === 'CHECKING'} onClick={check}>AI ilə baxış et</button>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {review?.result && ['REVIEW_REQUIRED', 'INSUFFICIENT_EVIDENCE'].includes(review.state) && <><ul>{review.result.observations?.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul><p>{review.result.limitations}</p><h3>Tələbəyə əlavə suallar</h3><ul>{review.result.questionsForStudent?.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul><p className="text-xs">Paste hadisələri: {review.result.signals?.pasteCount ?? 0}; yazı uzunluğu qeydləri: {review.result.signals?.snapshots ?? 0}. Siqnalların olmaması mətnin orijinallığını təsdiqləmir.</p></>}
  </section>;
}
