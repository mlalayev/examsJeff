"use client";
import { useEffect, useRef, useState } from 'react';
import { parseSatText, SAT_IMPORT_MODULES, type SatImportResult } from '@/lib/sat-text-import';
import { SAT_IMPORT_INSTRUCTIONS } from '@/lib/sat-import-instructions';
import FormattedText from '@/components/FormattedText';

export default function SatTextImport({ text, onTextChange, onImport, disabled, onClose }: {
  text: string; onTextChange: (text: string) => void;
  onImport: (result: SatImportResult) => void; disabled: boolean;
  onClose?: () => void;
}) {
  const [preview, setPreview] = useState<SatImportResult | null>(null);
  const [message, setMessage] = useState('');
  const [reading, setReading] = useState(false);
  const applied = useRef(false);
  const fileVersion = useRef(0);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    input.current?.focus();
    return () => { fileVersion.current++; previous?.focus(); };
  }, []);
  const save = () => {
    if (disabled || reading || applied.current) return;
    const parsed = parseSatText(text);
    setPreview(parsed);
    if (parsed.errors.length) return;
    applied.current = true;
    try {
      onImport(parsed); onTextChange(''); setPreview(null);
      setMessage('Questions added to the editor. Use Edit to add images, then Save Exam.');
    } catch (error) {
      applied.current = false;
      setMessage(error instanceof Error ? error.message : 'Import failed. Text has been kept.');
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="sat-import-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-md border bg-white p-5">
    <div className="flex items-center justify-between gap-4">
      <h2 id="sat-import-title" className="font-semibold">Import SAT questions from text</h2>
      <button type="button" onClick={onClose} className="rounded border px-3 py-1">Close</button>
    </div>
    <p className="my-3 text-sm">Paste the complete text or select a UTF-8 .txt file with all four modules. Save Questions adds each question to its module as a normal editable card without deleting existing questions. Use Save Exam afterwards to save to the server.</p>
    <details className="mb-3 rounded border p-3"><summary className="cursor-pointer font-medium">ChatGPT instructions — math, text and ZIP standard</summary>
      <button type="button" className="my-2 rounded border px-3 py-1" onClick={async () => {
        try { await navigator.clipboard.writeText(SAT_IMPORT_INSTRUCTIONS); setMessage('Instructions copied. Paste them into ChatGPT.'); }
        catch { setMessage('Clipboard unavailable. Select and copy the instructions below.'); }
      }}>Copy ChatGPT instructions</button>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-sm select-text">{SAT_IMPORT_INSTRUCTIONS}</pre>
    </details>
    <details className="mb-3"><summary className="cursor-pointer text-sm font-medium">Text format — multiple choice and open answers</summary>
    <pre className="overflow-auto rounded bg-gray-50 p-3 text-xs">{'[verbal module 1]\n1. Question text\na. First choice\nb. Second choice\nc. Third choice\nd. Fourth choice\nAnswer: B\nExplanation: Optional explanation\n\n2. What is 2 + 3?\nType: SHORT_TEXT\nAnswer: 5 | five\n\nRepeat for [verbal module 2], [math module 1], [math module 2].\nStart numbering from 1 in each module.'}</pre></details>
    <label className="mb-3 block text-sm">Upload .txt or .zip (questions.txt + images/)
      <input type="file" accept=".txt,.zip,text/plain,application/zip" disabled={disabled || reading} className="mt-1 block w-full" onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = '';
        if (!file) return;
        const version = ++fileVersion.current;
        setPreview(null); setMessage('');
        const zip = /\.zip$/i.test(file.name);
        if (!/\.(txt|zip)$/i.test(file.name) || file.size > (zip ? 20 * 1024 * 1024 : 800000)) { setMessage('Choose a .txt file up to 800 KB or .zip up to 20 MB.'); return; }
        setReading(true);
        try {
          let value: string;
          if (zip) {
            const body = new FormData(); body.append('file', file);
            const response = await fetch('/api/admin/upload/sat-zip', { method: 'POST', body });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || `ZIP upload failed (${response.status}). Your previous text is unchanged.`);
            if (typeof data.text !== 'string') throw new Error('Invalid ZIP upload response.');
            value = data.text;
          } else value = await file.text();
          if (version !== fileVersion.current) return;
          if (value.length > 200000 || value.includes('\u0000') || value.includes('\uFFFD')) throw new Error('Use UTF-8 text, up to 200,000 characters.');
          onTextChange(value); applied.current = false;
        } catch (error) {
          if (version === fileVersion.current) setMessage(error instanceof Error ? error.message : 'Could not read file. Existing text was kept.');
        } finally { if (version === fileVersion.current) setReading(false); }
      }} />
    </label>
    <label className="block text-sm" htmlFor="sat-import-text">SAT question text</label>
    <textarea ref={input} id="sat-import-text" rows={12} maxLength={200000} disabled={disabled || reading}
      className="w-full rounded border p-3 font-mono text-sm" value={text}
      onChange={e => { onTextChange(e.target.value); applied.current = false; setPreview(null); setMessage(''); }} />
    <button type="button" disabled={disabled || reading || !text.trim()} className="my-3 rounded border px-4 py-2 disabled:opacity-50"
      onClick={() => { setPreview(parseSatText(text)); setMessage(''); }}>Validate and preview</button>
    <button type="button" disabled={disabled || reading || !text.trim()} className="my-3 ml-3 rounded bg-indigo-800 px-4 py-2 text-white disabled:opacity-50" onClick={save}>Save Questions</button>
    {reading && <p role="status">Reading file…</p>}
    {message && <p role="status">{message}</p>}
    {preview && <div>
      {preview.errors.length > 0 ? <ul role="alert" className="max-h-60 overflow-auto text-red-700">{preview.errors.map((e, i) => <li key={i}>{e}</li>)}</ul> : <>
        {preview.modules.map((questions, i) => <details key={i} className="my-2 rounded border p-3">
          <summary>{SAT_IMPORT_MODULES[i]} — {questions.length} questions</summary>
          {questions.map((q, j) => <div key={q.id} className="my-3 border-t pt-3 whitespace-pre-wrap">
            <p>{j + 1}. <FormattedText text={q.prompt.text} /></p>
            {q.image && <img src={q.image} alt="Question" className="max-h-64 max-w-full object-contain" />}
            {q.options?.choices?.map((choice: string, k: number) => <div key={k}>{'ABCD'[k]}. <FormattedText text={choice} />{q.options.choiceImages?.[k] && <img src={q.options.choiceImages[k]} alt={`Choice ${'ABCD'[k]}`} className="max-h-40 max-w-full object-contain" />}</div>)}
            <p className="font-semibold">Answer: {q.qtype === 'SHORT_TEXT' ? q.answerKey.answers.join(' | ') : 'ABCD'[q.answerKey.index]}</p>
            {q.explanation && <p>Explanation: <FormattedText text={q.explanation} /></p>}
          </div>)}
        </details>)}
      </>}
    </div>}
    </section>
  </div>;
}
