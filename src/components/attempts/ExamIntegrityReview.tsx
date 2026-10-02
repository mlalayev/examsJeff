'use client';
import { useEffect, useState } from 'react';
import { WritingOriginalityPanel } from './WritingOriginalityPanel';
export function ExamIntegrityReview({ attemptId }: { attemptId: string }) {
  const [data, setData] = useState<any>(null);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const endpoint = `/api/attempts/${attemptId}/integrity`;
  useEffect(() => { void fetch(endpoint).then(async r => { if (r.ok) setData(await r.json()); }).catch(() => {}); }, [endpoint]);
  if (!data) return null;
  if (!data.policy) return data.canReview ? <WritingOriginalityPanel attemptId={attemptId} /> : null;
  async function save() {
    try {
      const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'review', note }) });
      setMessage(r.ok ? 'Baxış qeydi saxlandı. Cəhdin statusu dəyişdirilmədi.' : 'Qeyd saxlanmadı. Ən azı 10 simvol yazın.');
    } catch { setMessage('Şəbəkə xətası. Yenidən cəhd edin.'); }
  }
  return <section className="m-4 rounded-lg border bg-amber-50 p-4 text-gray-900">
    <h2 className="font-semibold">İmtahan nəzarəti</h2>
    <p>{data.policy.state === 'INVALID' ? 'Qayda pozuntusu — fullscreen-dən çıxış. Nəticə etibarsızdır; cavablar saxlanılıb.' : 'Tam ekran qaydası bu cəhdə tətbiq olunub.'}</p>
    {data.canReview && <>
      {data.policy.state !== 'INVALID' && <WritingOriginalityPanel attemptId={attemptId} />}
      <details><summary>Hadisələr (server vaxtı)</summary><ul>{data.events.map((e: any) => <li key={e.id}>{new Date(e.occurredAt).toLocaleString()} — {e.kind}{e.metadata?.length != null ? ` (${e.metadata.length} simvol)` : ''}</li>)}</ul></details>
      {data.evidence && <details><summary>Saxlanmış cavablar — yalnız araşdırma üçün</summary><pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(data.evidence, null, 2)}</pre></details>}
      {data.policy.reviewNote && <p>Əvvəlki baxış: {data.policy.reviewNote}</p>}
      <textarea aria-label="Texniki problem üzrə baxış qeydi" className="mt-3 w-full rounded border p-2" maxLength={2000} value={note} onChange={e => setNote(e.target.value)} placeholder="Texniki problemi və qərarınızı qeyd edin. Yeni cəhd ayrıca təyin edilməlidir." />
      <button className="rounded border p-2" onClick={save}>Baxış qeydini saxla</button><p role="status">{message}</p>
    </>}
  </section>;
}
