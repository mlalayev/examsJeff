"use client";
import { useState } from 'react';

export type FeedbackRow = {
  studentId: string; name: string; attendance: 'PRESENT' | 'ABSENT' | 'LATE'; lateMinutes: string;
  performance: '' | 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'WEAK' | 'DID_NOT_PARTICIPATE';
  homeworkStatus: 'COMPLETED' | 'INCOMPLETE' | 'NOT_DONE' | 'NOT_ASSIGNED';
  feedback: string; behaviorNote: string;
};
const performances = [['', 'Not rated'], ['EXCELLENT', 'Excellent'], ['GOOD', 'Good'], ['AVERAGE', 'Average'], ['WEAK', 'Weak'], ['DID_NOT_PARTICIPATE', 'Did not participate']];
const homework = [['COMPLETED', 'Completed'], ['INCOMPLETE', 'Incomplete'], ['NOT_DONE', 'Not submitted'], ['NOT_ASSIGNED', 'Not assigned']];
const control = 'min-h-10 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm';

export default function QuickLessonFeedback({ rows, onChange, onBulkChange, onRemove, disabled = false }: {
  rows: FeedbackRow[]; onChange: (id: string, patch: Partial<FeedbackRow>) => void;
  onBulkChange: (ids: string[], patch: Partial<FeedbackRow>) => void;
  onRemove: (id: string) => void; disabled?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [bulkAttendance, setBulkAttendance] = useState('');
  const [bulkPerformance, setBulkPerformance] = useState('');
  const [bulkHomework, setBulkHomework] = useState('');
  const [message, setMessage] = useState('');
  const ids = selected.filter(id => rows.some(r => r.studentId === id));
  const toggle = (list: string[], id: string) => list.includes(id) ? list.filter(v => v !== id) : [...list, id];
  const apply = () => {
    const patch: Partial<FeedbackRow> = {};
    if (bulkAttendance) { patch.attendance = bulkAttendance as FeedbackRow['attendance']; if (bulkAttendance !== 'LATE') patch.lateMinutes = ''; }
    if (bulkPerformance) patch.performance = bulkPerformance === 'CLEAR' ? '' : bulkPerformance as FeedbackRow['performance'];
    if (bulkHomework) patch.homeworkStatus = bulkHomework as FeedbackRow['homeworkStatus'];
    onBulkChange(ids, patch);
    setMessage(`Updated ${ids.length} students in this form. Save lesson to keep changes.`);
    setBulkAttendance(''); setBulkPerformance(''); setBulkHomework('');
  };
  return <fieldset disabled={disabled} className="min-w-0 space-y-3 disabled:opacity-60">
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={rows.length > 0 && ids.length === rows.length} onChange={e => setSelected(e.target.checked ? rows.map(r => r.studentId) : [])} />Select all · {rows.length} students</label>
      <span className="text-xs text-slate-500">{rows.filter(r => r.attendance === 'PRESENT').length} present · {rows.filter(r => r.attendance === 'ABSENT').length} absent · {rows.filter(r => r.attendance === 'LATE').length} late</span>
    </div>
    <p className="text-xs text-slate-500">Update each row, or select students to apply the same values together. Notes are optional.</p>
    {ids.length > 0 && <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
      <p className="mb-2 text-sm font-semibold text-indigo-900">Apply to {ids.length} selected students</p>
      <div className="grid gap-2 sm:grid-cols-4">
        <select aria-label="Selected attendance" className={control} value={bulkAttendance} onChange={e => setBulkAttendance(e.target.value)}><option value="">Attendance: keep</option>{['PRESENT','ABSENT','LATE'].map(v => <option key={v} value={v}>{v[0]+v.slice(1).toLowerCase()}</option>)}</select>
        <select aria-label="Selected performance" className={control} value={bulkPerformance} onChange={e => setBulkPerformance(e.target.value)}><option value="">Performance: keep</option>{performances.map(([v,l]) => <option key={v} value={v || 'CLEAR'}>{l}</option>)}</select>
        <select aria-label="Selected homework" className={control} value={bulkHomework} onChange={e => setBulkHomework(e.target.value)}><option value="">Homework: keep</option>{homework.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select>
        <button type="button" disabled={!bulkAttendance && !bulkPerformance && !bulkHomework} onClick={apply} className="rounded-lg bg-[#303380] px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Apply to selected</button>
      </div>
    </div>}
    {message && <p role="status" className="text-xs text-indigo-800">{message}</p>}
    <div className="divide-y rounded-xl border border-slate-200 bg-white">
      {rows.map(row => { const open = expanded.includes(row.studentId); return <div key={row.studentId} className="p-3">
        <div className="grid items-center gap-3 md:grid-cols-[minmax(140px,1.2fr)_minmax(200px,1.4fr)_minmax(120px,1fr)_minmax(120px,1fr)_auto]">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-900"><input type="checkbox" aria-label={`Select ${row.name}`} checked={ids.includes(row.studentId)} onChange={() => setSelected(toggle(ids, row.studentId))} />{row.name}</label>
          <div><div className="mb-1 text-xs text-slate-500">Attendance</div><div className="flex rounded-lg border p-0.5">{(['PRESENT','ABSENT','LATE'] as const).map(v => <button type="button" key={v} aria-label={`${row.name}: ${v.toLowerCase()}`} aria-pressed={row.attendance === v} onClick={() => onChange(row.studentId, { attendance: v, ...(v !== 'LATE' ? { lateMinutes: '' } : {}) })} className={`min-h-9 flex-1 rounded-md px-2 text-xs font-medium ${row.attendance === v ? 'bg-[#303380] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{v[0]+v.slice(1).toLowerCase()}</button>)}</div></div>
          <label className="text-xs text-slate-500">Performance<select aria-label={`${row.name}: performance`} className={`${control} mt-1 text-slate-900`} value={row.performance} onChange={e => onChange(row.studentId, { performance: e.target.value as FeedbackRow['performance'] })}>{performances.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="text-xs text-slate-500">Homework<select aria-label={`${row.name}: homework`} className={`${control} mt-1 text-slate-900`} value={row.homeworkStatus} onChange={e => onChange(row.studentId, { homeworkStatus: e.target.value as FeedbackRow['homeworkStatus'] })}>{homework.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <button type="button" aria-expanded={open} aria-controls={`notes-${row.studentId}`} onClick={() => setExpanded(toggle(expanded, row.studentId))} className="min-h-10 rounded-lg border px-3 text-xs font-medium text-indigo-800">{open ? 'Close notes' : row.feedback || row.behaviorNote ? 'Edit notes' : '+ Note'}</button>
        </div>
        {row.attendance === 'LATE' && <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">Late minutes<input aria-label={`${row.name}: late minutes`} type="number" min={0} max={600} value={row.lateMinutes} onChange={e => onChange(row.studentId, { lateMinutes: e.target.value })} className="w-20 rounded border p-2" /></label>}
        {open && <div id={`notes-${row.studentId}`} className="mt-3 grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
          <label className="text-xs text-slate-600">Feedback for student / parent<textarea aria-label={`${row.name}: feedback`} rows={2} value={row.feedback} onChange={e => onChange(row.studentId, { feedback: e.target.value })} className={`${control} mt-1`} /></label>
          <label className="text-xs text-slate-600">Behavior note<textarea aria-label={`${row.name}: behavior`} rows={2} value={row.behaviorNote} onChange={e => onChange(row.studentId, { behaviorNote: e.target.value })} className={`${control} mt-1`} /></label>
          <button type="button" onClick={() => onRemove(row.studentId)} className="justify-self-start text-xs text-rose-700 underline">Remove from class…</button>
        </div>}
      </div>; })}
    </div>
  </fieldset>;
}
