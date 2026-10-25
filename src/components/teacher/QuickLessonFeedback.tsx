"use client";
import { useState } from 'react';
import { SlidersHorizontal, MessageSquare, ChevronDown } from 'lucide-react';

export type FeedbackRow = {
  studentId: string; name: string; attendance: 'PRESENT' | 'ABSENT' | 'LATE'; lateMinutes: string;
  performance: '' | 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'WEAK' | 'DID_NOT_PARTICIPATE';
  homeworkStatus: 'COMPLETED' | 'INCOMPLETE' | 'NOT_DONE' | 'NOT_ASSIGNED';
  feedback: string; behaviorNote: string;
};
const performances = [['', 'Not rated'], ['EXCELLENT', 'Excellent'], ['GOOD', 'Good'], ['AVERAGE', 'Average'], ['WEAK', 'Weak'], ['DID_NOT_PARTICIPATE', 'Did not participate']];
const homework = [['COMPLETED', 'Completed'], ['INCOMPLETE', 'Incomplete'], ['NOT_DONE', 'Not submitted'], ['NOT_ASSIGNED', 'Not assigned']];
const control = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#303380] focus:ring-2 focus:ring-indigo-100';

export default function QuickLessonFeedback({ rows, onChange, onBulkChange, onRemove, disabled = false }: {
  rows: FeedbackRow[]; onChange: (id: string, patch: Partial<FeedbackRow>) => void;
  onBulkChange: (ids: string[], patch: Partial<FeedbackRow>) => void;
  onRemove: (id: string) => void; disabled?: boolean;
}) {
  const [bulkOpen, setBulkOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [bulkAttendance, setBulkAttendance] = useState('');
  const [bulkPerformance, setBulkPerformance] = useState('');
  const [bulkHomework, setBulkHomework] = useState('');
  const [message, setMessage] = useState('');
  const ids = rows.map(row => row.studentId);
  const toggle = (list: string[], id: string) => list.includes(id) ? list.filter(v => v !== id) : [...list, id];
  const apply = () => {
    const patch: Partial<FeedbackRow> = {};
    if (bulkAttendance) { patch.attendance = bulkAttendance as FeedbackRow['attendance']; if (bulkAttendance !== 'LATE') patch.lateMinutes = ''; }
    if (bulkPerformance) patch.performance = bulkPerformance === 'CLEAR' ? '' : bulkPerformance as FeedbackRow['performance'];
    if (bulkHomework) patch.homeworkStatus = bulkHomework as FeedbackRow['homeworkStatus'];
    onBulkChange(ids, patch);
    setMessage(`Updated ${ids.length} students in this form. Save lesson to keep changes.`);
    setBulkAttendance(''); setBulkPerformance(''); setBulkHomework(''); setBulkOpen(false);
  };
  return <fieldset disabled={disabled} className="min-w-0 space-y-3 disabled:opacity-60">
    <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
      <div><h3 className="text-base font-semibold text-slate-900">Students <span className="ml-1 text-sm font-normal text-slate-400">{rows.length}</span></h3>
        <p className="mt-1 text-xs text-slate-500">{rows.filter(r => r.attendance === 'PRESENT').length} present · {rows.filter(r => r.attendance === 'ABSENT').length} absent · {rows.filter(r => r.attendance === 'LATE').length} late</p>
      </div>
      <button type="button" aria-expanded={bulkOpen} onClick={() => setBulkOpen(!bulkOpen)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#303380] hover:bg-indigo-50"><SlidersHorizontal size={14}/>Update all<ChevronDown size={14}/></button>
    </div>
    {bulkOpen && rows.length > 0 && <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
      <p className="mb-3 text-sm font-medium text-slate-700">Apply the same values to all {ids.length} students. Other fields stay unchanged.</p>
      <div className="grid gap-2 sm:grid-cols-4">
        <select aria-label="All students attendance" className={control} value={bulkAttendance} onChange={e => setBulkAttendance(e.target.value)}><option value="">Attendance: keep</option>{['PRESENT','ABSENT','LATE'].map(v => <option key={v} value={v}>{v[0]+v.slice(1).toLowerCase()}</option>)}</select>
        <select aria-label="All students performance" className={control} value={bulkPerformance} onChange={e => setBulkPerformance(e.target.value)}><option value="">Performance: keep</option>{performances.map(([v,l]) => <option key={v} value={v || 'CLEAR'}>{l}</option>)}</select>
        <select aria-label="All students homework" className={control} value={bulkHomework} onChange={e => setBulkHomework(e.target.value)}><option value="">Homework: keep</option>{homework.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select>
        <button type="button" disabled={!bulkAttendance && !bulkPerformance && !bulkHomework} onClick={apply} className="rounded-lg bg-[#303380] px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Apply to all</button>
      </div>
    </div>}
    {message && <p role="status" className="text-xs text-indigo-800">{message}</p>}
    <div className="space-y-3">
      {rows.map(row => { const open = expanded.includes(row.studentId); return <div key={row.studentId} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-100/60">
        <div className="grid items-center gap-3 lg:grid-cols-[minmax(150px,1.2fr)_minmax(190px,1.3fr)_minmax(130px,1fr)_minmax(130px,1fr)_auto]">
          <div className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-[#303380]">{row.name.split(' ').filter(Boolean).slice(0,2).map(n => n[0]).join('')}</span><span className="break-words text-sm font-semibold text-slate-800">{row.name}</span></div>
          <div><div className="mb-1 text-xs text-slate-500">Attendance</div><div className="flex rounded-xl bg-slate-100 p-1">{(['PRESENT','ABSENT','LATE'] as const).map(v => <button type="button" key={v} aria-label={`${row.name}: ${v.toLowerCase()}`} aria-pressed={row.attendance === v} onClick={() => onChange(row.studentId, { attendance: v, ...(v !== 'LATE' ? { lateMinutes: '' } : {}) })} className={`min-h-9 flex-1 rounded-md px-2 text-xs font-medium ${row.attendance === v ? v === 'PRESENT' ? 'bg-white text-emerald-700 shadow-sm' : v === 'ABSENT' ? 'bg-white text-rose-700 shadow-sm' : 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:bg-white/60'}`}>{v[0]+v.slice(1).toLowerCase()}</button>)}</div></div>
          <label className="text-xs text-slate-500">Performance<select aria-label={`${row.name}: performance`} className={`${control} mt-1 text-slate-900`} value={row.performance} onChange={e => onChange(row.studentId, { performance: e.target.value as FeedbackRow['performance'] })}>{performances.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="text-xs text-slate-500">Homework<select aria-label={`${row.name}: homework`} className={`${control} mt-1 text-slate-900`} value={row.homeworkStatus} onChange={e => onChange(row.studentId, { homeworkStatus: e.target.value as FeedbackRow['homeworkStatus'] })}>{homework.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <button type="button" aria-expanded={open} aria-controls={`notes-${row.studentId}`} onClick={() => setExpanded(toggle(expanded, row.studentId))} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-medium text-[#303380] hover:bg-indigo-50"><MessageSquare size={15}/>{open ? 'Close notes' : row.feedback || row.behaviorNote ? 'Edit notes' : '+ Note'}</button>
        </div>
        {row.attendance === 'LATE' && <label className="mt-3 flex items-center justify-end gap-2 text-xs text-amber-800">Late minutes<input aria-label={`${row.name}: late minutes`} type="number" min={0} max={600} value={row.lateMinutes} onChange={e => onChange(row.studentId, { lateMinutes: e.target.value })} className="w-20 rounded-lg border border-amber-200 bg-amber-50/50 p-2 outline-none focus:ring-2 focus:ring-amber-100" /></label>}
        {open && <div id={`notes-${row.studentId}`} className="mt-3 grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
          <label className="text-xs text-slate-600">Feedback for student / parent<textarea aria-label={`${row.name}: feedback`} rows={2} value={row.feedback} onChange={e => onChange(row.studentId, { feedback: e.target.value })} className={`${control} mt-1`} /></label>
          <label className="text-xs text-slate-600">Behavior note<textarea aria-label={`${row.name}: behavior`} rows={2} value={row.behaviorNote} onChange={e => onChange(row.studentId, { behaviorNote: e.target.value })} className={`${control} mt-1`} /></label>
          <button type="button" onClick={() => onRemove(row.studentId)} className="justify-self-start text-xs text-rose-700 underline">Remove from class…</button>
        </div>}
      </div>; })}
    </div>
  </fieldset>;
}
