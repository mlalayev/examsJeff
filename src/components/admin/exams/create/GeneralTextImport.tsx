"use client";
import { useEffect, useRef, useState } from 'react';
import { GENERAL_SECTIONS, GENERAL_TEXT_TYPES, parseGeneralText, type GeneralImportResult } from '@/lib/general-text-import';
import { QUESTION_TYPE_LABELS } from './constants';
import { parseHomeworkText } from '@/lib/homework-text-import';
import type { ExamCategory, QuestionType, SectionType } from './types';
import FormattedText from '@/components/FormattedText';

export function generalImportInstructions(types: QuestionType[], sections: SectionType[], homeworkCategory?: ExamCategory) {
  return `Create a ${homeworkCategory ? homeworkCategory + " homework" : "General English exam"} as plain UTF-8 questions.txt, or plain text. No Markdown fences, HTML/CSS, JSON or ZIP.
Allowed sections: ${sections.join(', ')}. Repeat any section type as often as needed; every heading creates a separate section. Omit unwanted sections. Include all selected sections.
Allowed question types: ${types.join(', ')}. Use only these types and write Type: explicitly on every question.
Each section begins [section: READING] or [reading] (replace READING with its type). For separate audio tracks use [listening] again for each track.
Before questions use Title: ..., Duration: 20 (integer minutes), Instruction: ... .
Reading requires one [passage] ... [/passage] block before its questions. For a separate reading text, start another [reading] section with its own passage block.
Each Listening section has its own audio, uploaded separately by the teacher after import. Give repeated sections distinct Title: values such as Listening 1 and Listening 2. Do not invent audio links or include an Audio field. Create questions for the supplied audio/transcript; ask for it if missing. Do not include answers in the student-facing instructions or passage.
Number questions 1., 2., ... starting at 1 in each section. Put all multiline question/task text BEFORE Type:. Use unnumbered lines for task bullet points.
MCQ_SINGLE / INLINE_SELECT: 2–8 choices a. through h., then Answer: B.
MCQ_MULTI: 2–8 choices, then Answer: A, C.
TF: Answer: TRUE or FALSE. TF_NG: Answer: TRUE, FALSE or NOT GIVEN. No choices.
SHORT_TEXT: Answer: accepted answer | alternative. No choices.
FILL_IN_BLANK: use [input] in the question text; Answer: first blank | second blank. One exact answer per blank.
DND_GAP: use ___ for blanks; Bank: word1 | word2 | distractor; Answer: word1 | word2 in blank order.
ORDER_SENTENCE: Tokens: am | I | happy; Answer: 2, 1, 3 (one-based token positions, every token exactly once).
ESSAY: only in WRITING; no Answer or choices. Include word count and task requirements in question text. Writing allows ESSAY and SHORT_TEXT only. Essays require separate grading, not an answer key.
${homeworkCategory ? "Required" : "Optional"} Explanation: comes last in each question. ${homeworkCategory ? "Explain the answer or give marking guidance for an essay. Keep solutions out of prompts and passages." : ""} Check all answer keys. No unsupported fields, image markers or embedded files; images can be added using Edit afterwards.
Maximum text 200,000 characters. Use $...$ for inline math, $$...$$ for separate equations if needed.

Format example (use only your selected sections/types):
[section: READING]
Title: A day in the park
Duration: 20
Instruction: Read the text and answer the questions.
[passage]
Anna visited the park on Sunday. She travelled by bus.
[/passage]
1. How did Anna travel?
Type: MCQ_SINGLE
a. By train
b. By bus
Answer: B
Explanation: The text says she travelled by bus.
2. Anna visited on Saturday.
Type: TF
Answer: FALSE${homeworkCategory ? "\nExplanation: The passage says Sunday." : ""}

[section: WRITING]
Title: Writing task
Duration: 30
1. Write 100–150 words about a place you enjoy visiting. Describe it and explain why you like it.
Type: ESSAY${homeworkCategory ? "\nExplanation: Describe the place and support your preference with specific details." : ""}
`;
}

export default function GeneralTextImport({ homeworkCategory, text, onTextChange, onImport, onClose }: {
  homeworkCategory?: ExamCategory; text: string; onTextChange: (text: string) => void; onImport: (result: GeneralImportResult) => void; onClose: () => void;
}) {
  const [types, setTypes] = useState<QuestionType[]>(GENERAL_TEXT_TYPES);
  const [sections, setSections] = useState<SectionType[]>(GENERAL_SECTIONS);
  const [preview, setPreview] = useState<GeneralImportResult | null>(null);
  const [message, setMessage] = useState('');
  const [reading, setReading] = useState(false);
  const applied = useRef(false); const version = useRef(0);
  useEffect(() => () => { version.current++; }, []);
  const modules = homeworkCategory === 'SAT' || homeworkCategory === 'MATH';
  const instructions = modules
    ? `Create a ${homeworkCategory} homework as plain UTF-8 questions.txt. Include only needed modules, each on its own line: ${homeworkCategory === 'SAT' ? '[verbal module 1], [verbal module 2], ' : ''}[math module 1], [math module 2]. Number questions from 1 in each module. For multiple choice use four lines a. through d. and Answer: B. For an open question put Type: SHORT_TEXT and Answer: followed by a value (alternatives separated by |). End EVERY question with Explanation: followed by a worked solution. Keep solutions out of prompts and choices. Use $...$ for inline math and $$...$$ for display math.`
    : generalImportInstructions(types, sections, homeworkCategory);
  const validate = () => { const result = homeworkCategory ? parseHomeworkText(text, homeworkCategory, types, sections) : parseGeneralText(text, types, sections); setPreview(result); return result; };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
    <section role="dialog" aria-modal="true" aria-label={homeworkCategory ? "Import homework questions" : "Import General English questions"} className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-xl bg-white p-5">
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">{homeworkCategory ? "Import homework questions" : "Import General English questions"}</h2><button type="button" onClick={onClose} className="rounded border px-3 py-2">Close</button></div>
      <p className="my-3 text-sm text-slate-600">{homeworkCategory
        ? "Copy the instructions to ChatGPT. Paste its questions here or upload a .txt file, then select Save Questions. Every question needs an explanation. Students can review it after submitting the homework."
        : "Choose sections and question types, copy the instructions to ChatGPT, then paste its text or upload questions.txt. Each heading creates a new section, even when its type repeats. Existing sections and audio stay unchanged. Upload a separate audio file in each Listening section. Save Exam saves to the server."}</p>
      {!modules && <fieldset className="mb-3 rounded border p-3"><legend className="px-1 text-sm font-semibold">Sections to include</legend><div className="flex flex-wrap gap-4">{GENERAL_SECTIONS.map(type => <label key={type} className="text-sm"><input type="checkbox" checked={sections.includes(type)} onChange={e => { setSections(e.target.checked ? [...sections,type] : sections.filter(t => t !== type)); setPreview(null); }} /> {type}</label>)}</div></fieldset>}
      {!modules && <fieldset className="mb-3 rounded border p-3"><legend className="px-1 text-sm font-semibold">Allowed question types</legend><div className="grid gap-2 sm:grid-cols-2">{GENERAL_TEXT_TYPES.map(type => <label key={type} className="text-sm"><input type="checkbox" checked={types.includes(type)} onChange={e => { setTypes(e.target.checked ? [...types,type] : types.filter(t => t !== type)); setPreview(null); }} /> {QUESTION_TYPE_LABELS[type]}</label>)}</div></fieldset>}
      <details className="mb-3 rounded border p-3"><summary className="cursor-pointer font-medium">ChatGPT instructions and file format</summary>
        <button type="button" className="my-2 rounded border p-2" onClick={async () => { try { await navigator.clipboard.writeText(instructions); setMessage('Instructions copied.'); } catch { setMessage('Select and copy the instructions below.'); } }}>Copy ChatGPT instructions</button>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs">{instructions}</pre>
      </details>
      <label className="block text-sm">Upload UTF-8 .txt<input type="file" accept=".txt,text/plain" disabled={reading} className="my-2 block" onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
        if (!/\.txt$/i.test(file.name) || file.size > 800000) { setMessage('Choose a .txt file up to 800 KB.'); return; }
        const current = ++version.current; setReading(true); setMessage('');
        try { const value = await file.text(); if (current !== version.current) return;
          if (value.length > 200000 || /[\u0000\uFFFD]/.test(value)) throw new Error('Use UTF-8 text up to 200,000 characters.');
          onTextChange(value); setPreview(null); applied.current = false;
        } catch (error) { if (current === version.current) setMessage((error as Error).message); }
        finally { if (current === version.current) setReading(false); }
      }} /></label>
      <textarea aria-label={homeworkCategory ? "Homework question text" : "General English question text"} rows={12} maxLength={200000} disabled={reading} value={text} onChange={e => { onTextChange(e.target.value); setPreview(null); applied.current = false; }} className="w-full rounded border p-3 font-mono text-sm" />
      <div className="my-3 flex gap-3"><button type="button" className="rounded border p-2 disabled:opacity-50" disabled={reading || !text.trim()} onClick={validate}>Validate and preview</button><button type="button" className="rounded bg-indigo-800 px-4 py-2 text-white disabled:opacity-50" disabled={reading || !text.trim()} onClick={() => {
        if (applied.current) return; const result = validate(); if (result.errors.length) return;
        try { applied.current = true; onImport(result); onTextChange(''); } catch (error) { applied.current = false; setMessage((error as Error).message); }
      }}>Save Questions</button></div>
      {message && <p role="status" className="my-2 text-sm">{message}</p>}
      {preview?.errors.length ? <ul role="alert" className="text-sm text-red-700">{preview.errors.map((e,i) => <li key={i}>{e}</li>)}</ul> : preview && <div>
        {preview.warnings.map((w,i) => <p key={i} className="my-2 text-sm text-amber-800">{w}</p>)}
        {preview.sections.map(s => <details key={s.id} className="my-2 rounded border p-3"><summary>{s.title} · {s.questions.length} questions · {s.durationMin} min</summary>
          {s.passage && <div className="my-3 whitespace-pre-wrap rounded bg-slate-50 p-3"><FormattedText text={s.passage} /></div>}
          {s.questions.map((q,i) => <div key={q.id} className="my-2 border-t pt-2"><p>{i+1}. {QUESTION_TYPE_LABELS[q.qtype]}</p><FormattedText text={q.prompt.text || q.prompt.textWithBlanks || ''} /><pre className="whitespace-pre-wrap text-xs">{JSON.stringify({options:q.options,answer:q.answerKey},null,2)}</pre></div>)}
        </details>)}
      </div>}
    </section>
  </div>;
}
