"use client";
import MonthlyLessonSummary from './MonthlyLessonSummary';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, FileText, MoreHorizontal, Plus, Settings2, Users, X } from 'lucide-react';

type Lesson = { id: string; title: string; date: string; timeSlot: string; status: string; _count?: { studentRecords: number }; class: { name: string; _count?: { classStudents: number } } | null };
const hasFeedback = (lesson: Lesson) => (lesson._count?.studentRecords ?? 0) > 0;
const lessonColor = (lesson: Lesson) => hasFeedback(lesson) ? 'border-emerald-200 border-l-emerald-500 bg-emerald-50/70' : 'border-rose-200 border-l-rose-400 bg-rose-50/60';
type Month = { reportWeeks?: string[]; year: number; month: number; lessons: Lesson[]; oddDays: unknown[]; evenDays: unknown[] };
export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function weekDates(anchor: Date) {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - anchor.getDay());
  return Array.from({length:7}, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate()+i));
}
const fmt = (d: Date, options: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', options);
const action = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50';

export default function ScheduleWorkspace({ data, loading, error, toast, applying, clearing, onNavigate, onDay, onLesson, onSchedule, onApply, onClear, onReport }: {
  data: Month | null; loading: boolean; error: string | null; toast: string | null; applying: boolean; clearing: boolean;
  onNavigate: (date: Date) => void; onDay: (date: Date) => void; onSchedule: () => void;
  onLesson?: (date: Date, lesson: Lesson) => void;
  onApply: () => void; onClear: () => void; onReport: (date: Date) => void;
}) {
  const [anchor, setAnchor] = useState(() => new Date());
  const [view, setView] = useState<'week'|'month'>('week');
  const [more, setMore] = useState(false);
  const [reports, setReports] = useState(false);
  const [reportDate, setReportDate] = useState(dayKey(new Date()));
  const [extra, setExtra] = useState<Lesson[]>([]);
  const [extraError, setExtraError] = useState('');
  const [extraLoading, setExtraLoading] = useState(false);
  const days = useMemo(() => weekDates(anchor), [anchor]);
  const navigate = (date: Date) => { setAnchor(date); onNavigate(date); setMore(false); };
  const shift = (direction: number) => navigate(view === 'week'
    ? new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()+direction*7)
    : new Date(anchor.getFullYear(), anchor.getMonth()+direction, 1));
  // Boundary weeks can include two months. Load the other month without changing the active month's actions.
  useEffect(() => {
    const controller = new AbortController();
    setExtra([]); setExtraError('');
    const dates = view === 'week' ? days.filter(d => d.getMonth() !== anchor.getMonth() || d.getFullYear() !== anchor.getFullYear()) : [];
    if (!dates.length) { setExtraLoading(false); return () => controller.abort(); }
    setExtraLoading(true);
    const date = dates[0];
    fetch(`/api/teacher/schedule/month?year=${date.getFullYear()}&month=${date.getMonth()+1}`, { signal: controller.signal })
      .then(async r => { if (!r.ok) throw new Error('Could not load the adjoining month.'); return r.json(); })
      .then(body => { if (!controller.signal.aborted) setExtra(body.lessons || []); })
      .catch(e => { if (!controller.signal.aborted) setExtraError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setExtraLoading(false); });
    return () => controller.abort();
  }, [anchor, days, view, data]);
  const current = data?.year === anchor.getFullYear() && data?.month === anchor.getMonth()+1 ? data.lessons : [];
  const lessons = [...current, ...extra].filter(l => l.status !== 'CANCELLED');
  const forDate = (date: Date) => lessons.filter(l => l.date.slice(0,10) === dayKey(date)).sort((a,b) => a.timeSlot.localeCompare(b.timeSlot));
  const weekCount = days.reduce((count, date) => count + forDate(date).length, 0);
  const hasSlots = !!data && data.oddDays.length + data.evenDays.length > 0;
  const title = view === 'month' ? fmt(anchor, {month:'long',year:'numeric'}) : `${fmt(days[0],{month:'short',day:'numeric'})} – ${fmt(days[6],{month:'short',day:'numeric',year:'numeric'})}`;
  const calendarDays = Array.from({length: new Date(anchor.getFullYear(), anchor.getMonth()+1, 0).getDate()}, (_,i) => new Date(anchor.getFullYear(),anchor.getMonth(),i+1));
  const busy = loading || extraLoading;
  return <>
    <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div><div className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-700">Teaching workspace</div><h1 className="text-3xl font-semibold tracking-tight text-slate-900">Your schedule</h1><p className="mt-2 text-sm text-slate-500">Plan your classes. Keep every lesson in one place.</p></div>
      <div className="flex flex-wrap gap-2">
        <MonthlyLessonSummary year={anchor.getFullYear()} month={anchor.getMonth()+1} />
        <button className={action} onClick={() => { setReportDate(dayKey(anchor)); setReports(true); }}><FileText size={17}/>Reports</button>
        <button disabled={loading || !data} className="inline-flex items-center gap-2 rounded-xl bg-[#303380] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" onClick={onSchedule}><Settings2 size={17}/>Manage schedule</button>
      </div>
    </header>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3"><span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-800"><CalendarDays size={22}/></span><div><p className="text-sm font-semibold text-slate-900">{busy ? 'Loading lessons…' : `${view === 'week' ? weekCount : current.filter(l=>l.status!=='CANCELLED').length} lessons this ${view}`}</p><p className="text-xs text-slate-500">Select a lesson to record attendance and feedback.</p></div></div>
      <div className="flex items-center gap-2">
        {hasSlots && <button className={action} disabled={applying || loading} onClick={onApply}><Plus size={16}/>{applying ? 'Applying…' : `Apply to ${fmt(anchor,{month:'short'})}`}</button>}
        <div className="relative"><button aria-label="More schedule actions" aria-expanded={more} onClick={()=>setMore(!more)} className={action}><MoreHorizontal size={19}/></button>
          {more && <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border bg-white p-2 shadow-lg"><p className="px-3 py-2 text-xs text-slate-500">{fmt(anchor,{month:'long',year:'numeric'})}</p><button disabled={clearing || loading} className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50" onClick={()=>{setMore(false);onClear();}}>Clear month & feedback</button></div>}
        </div>
      </div>
    </div>
    {(toast || error || extraError) && <div role={error || extraError ? 'alert':'status'} className={`mb-4 rounded-xl border p-3 text-sm ${error || extraError ? 'border-rose-200 bg-rose-50 text-rose-800':'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || extraError || toast}</div>}
    {!loading && data && !hasSlots && current.length === 0 && <div className="mb-5 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-5"><h2 className="font-semibold text-slate-900">Build your teaching routine</h2><p className="mt-1 text-sm text-slate-600">Add your odd or even date classes in Manage schedule, then apply them to this month.</p><button className="mt-3 text-sm font-semibold text-indigo-800" onClick={onSchedule}>Set up schedule →</button></div>}
    <div aria-label="Schedule color legend" className="mb-3 flex flex-wrap gap-4 text-xs text-slate-600">
      <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-indigo-200 ring-1 ring-indigo-400"/>Today</span>
      <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-300"/>Feedback saved</span>
      <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-rose-100 ring-1 ring-rose-300"/>Feedback not saved</span>
    </div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-4 sm:p-5"><div className="flex items-center gap-2"><button className="rounded-lg p-2 hover:bg-slate-100" aria-label={`Previous ${view}`} onClick={()=>shift(-1)}><ChevronLeft size={19}/></button><h2 className="text-base font-semibold text-slate-900">{title}</h2><button className="rounded-lg p-2 hover:bg-slate-100" aria-label={`Next ${view}`} onClick={()=>shift(1)}><ChevronRight size={19}/></button></div>
        <div className="flex gap-3"><button className="text-sm font-medium text-slate-600" onClick={()=>navigate(new Date())}>Today</button><div className="flex rounded-lg bg-slate-100 p-1">{(['week','month'] as const).map(v=><button key={v} aria-pressed={view===v} className={`rounded-md px-4 py-1.5 text-sm capitalize ${view===v?'bg-white font-semibold text-indigo-900 shadow-sm':'text-slate-500'}`} onClick={()=>setView(v)}>{v}</button>)}</div></div>
      </div>
      {busy ? <div className="p-16 text-center text-sm text-slate-500" role="status">Loading schedule…</div> : view === 'week' ? <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 xl:grid-cols-7 xl:divide-x xl:divide-y-0">
        {days.map(date => { const items = forDate(date); const today = dayKey(date)===dayKey(new Date()); return <div key={dayKey(date)} className={`min-w-0 p-3 xl:min-h-[360px] ${today?'bg-indigo-100/60 ring-1 ring-inset ring-indigo-300':''}`}>
          <button onClick={()=>{navigate(date);onDay(date);}} className="mb-4 flex w-full items-center justify-between rounded-lg p-2 text-left hover:bg-slate-100"><span className="text-xs font-semibold uppercase text-slate-500">{fmt(date,{weekday:'short'})}</span><span className={`flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold ${today?'bg-[#303380] text-white':'text-slate-800'}`}>{date.getDate()}</span></button>
          {date.getDay() === 0 && <button type="button" onClick={() => onReport(date)} className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#303380] px-3 py-3 text-xs font-semibold text-white shadow-sm hover:bg-indigo-900"><FileText size={15}/>Weekly reports <span aria-label={data?.reportWeeks?.includes(dayKey(date)) ? "Reports ready" : "Reports not prepared"} className="ml-1">{data?.reportWeeks?.includes(dayKey(date)) ? "✓ Done" : "✕"}</span></button>}
          <div className="space-y-2">{items.map(lesson=><button key={lesson.id} onClick={()=>{if (onLesson) onLesson(date, lesson); else {navigate(date);onDay(date);}}} className={`w-full rounded-xl border border-l-[3px] p-3 text-left shadow-sm transition hover:shadow-md ${lessonColor(lesson)}`}><span className="mb-2 flex items-center gap-1 text-xs text-indigo-700"><Clock size={12}/>{lesson.timeSlot}</span><span className="block break-words text-sm font-semibold text-slate-900">{lesson.class?.name || lesson.title}</span><span className="mt-2 flex items-center gap-1 text-xs text-slate-500"><Users size={12}/>{lesson.class?._count?.classStudents || 0} students</span><span className={`mt-2 block text-xs ${hasFeedback(lesson) ? 'text-emerald-800' : 'text-rose-800'}`}>{hasFeedback(lesson) ? 'Feedback saved' : 'Feedback not saved'}</span></button>)}{!items.length && <button className="w-full rounded-xl border border-dashed p-4 text-center text-xs text-slate-400 hover:border-indigo-300 hover:text-indigo-700" onClick={()=>{navigate(date);onDay(date);}}>No lessons · Add</button>}</div>
        </div>; })}
      </div> : <div className="overflow-x-auto"><div className="min-w-[560px] grid grid-cols-7">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d} className="border-b bg-slate-50 p-3 text-center text-xs font-semibold text-slate-500">{d}</div>)}{Array.from({length:calendarDays[0].getDay()},(_,i)=><div key={`pad${i}`} className="border-b border-r bg-slate-50/50"/>)}{calendarDays.map(date=><button key={dayKey(date)} onClick={()=>{navigate(date);onDay(date);}} className={`min-h-28 border-b border-r border-slate-100 p-2 text-left align-top hover:bg-indigo-50 ${dayKey(date)===dayKey(new Date()) ? 'bg-indigo-100/60 ring-1 ring-inset ring-indigo-300' : ''}`}><span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${dayKey(date)===dayKey(new Date())?'bg-[#303380] text-white':'text-slate-600'}`}>{date.getDate()}</span>{forDate(date).slice(0,2).map(l=><span key={l.id} className={`mt-1 block truncate rounded border p-1 text-xs text-slate-800 ${lessonColor(l)}`}>{l.timeSlot} · {l.class?.name || l.title}</span>)}{forDate(date).length>2 && <span className="text-xs text-slate-500">+{forDate(date).length-2} more</span>}</button>)}</div></div>}
    </section>
    {reports && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><section role="dialog" aria-modal="true" aria-label="Weekly reports" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Weekly reports</h2><button aria-label="Close reports" onClick={()=>setReports(false)}><X size={20}/></button></div><p className="my-3 text-sm text-slate-500">Choose any date in the week. Reports use saved attendance and feedback, Sunday through Saturday.</p><label className="block text-sm font-medium">Week containing<input type="date" value={reportDate} onChange={e=>setReportDate(e.target.value)} className="my-2 block w-full rounded-lg border p-3"/></label><button disabled={!reportDate} className="mt-3 w-full rounded-xl bg-[#303380] p-3 text-sm font-semibold text-white disabled:opacity-50" onClick={()=>{const [y,m,d]=reportDate.split('-').map(Number);onReport(weekDates(new Date(y,m-1,d))[0]);setReports(false);}}>Open weekly reports</button></section></div>}
  </>;
}
