"use client";
import { useEffect, useState } from 'react';
const label = (value: string) => value.toLowerCase().replaceAll('_',' ').replace(/^./,c=>c.toUpperCase());
type RecordRow = {id:string;attendance:string;lateMinutes:number;performance:string|null;homeworkStatus:string;feedback:string|null;behaviorNote:string|null;lessonSession:{date:string;title:string;topic:string|null;timeSlot:string};class:{name:string}|null;teacher:{firstName:string|null;lastName:string|null}};
type Data = {records:RecordRow[];summary:{recorded:number;attended:number;absent:number;excused:number;late:number;lateMinutes:number;performance:Record<string,number>}};
export default function MonthlyAttendance() {
  const [month,setMonth]=useState(()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Baku',year:'numeric',month:'2-digit'}).format(new Date()));
  const [data,setData]=useState<Data|null>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError('');setData(null);
    const [year,m]=month.split('-');
    fetch(`/api/student/attendance?year=${year}&month=${m}`,{signal:controller.signal,cache:'no-store'}).then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body.error || 'Could not load attendance.');return body;}).then(body=>{if(!controller.signal.aborted)setData(body);}).catch(e=>{if(!controller.signal.aborted)setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[month,refresh]);
  useEffect(()=>{const onFocus=()=>setRefresh(v=>v+1);window.addEventListener('focus',onFocus);return()=>window.removeEventListener('focus',onFocus);},[]);
  return <section className="mx-auto mt-8 w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-slate-900">My attendance & feedback</h2><p className="mt-1 text-xs text-slate-500">Saved teacher records through today. Late arrivals count as attended; unrecorded lessons are not counted as absences.</p></div><div className="flex gap-2"><input aria-label="Attendance month" type="month" min="2000-01" max="2100-12" value={month} onChange={e=>{if(/^\d{4}-\d{2}$/.test(e.target.value))setMonth(e.target.value);}} className="rounded-lg border border-slate-200 p-2 text-sm"/><button onClick={()=>setRefresh(v=>v+1)} disabled={loading} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Refresh</button></div></div>
    {loading ? <p role="status" className="py-6 text-sm text-slate-500">Loading attendance…</p> : error ? <p role="alert" className="py-5 text-rose-700">{error}</p> : data && <>
      <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Attended',data.summary.attended],['Absent',data.summary.absent],['Late arrivals',data.summary.late],['Late minutes',data.summary.lateMinutes]].map(([name,value])=><div key={name} className="rounded-xl bg-indigo-50/60 p-4"><div className="text-2xl font-semibold text-[#303380]">{value}</div><div className="text-xs text-slate-600">{name}</div></div>)}</div>
      <p className="mb-3 text-xs text-slate-500">{data.summary.recorded} recorded lessons · {data.summary.excused} excused</p>
      <div className="mb-4 flex flex-wrap gap-2">{Object.entries(data.summary.performance).map(([rating,count])=><span key={rating} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{label(rating)}: {count}</span>)}</div>
      {!data.records.length && <p className="py-6 text-sm text-slate-500">No teacher records for this month yet.</p>}
      <div className="space-y-3">{data.records.map(r=><details key={r.id} className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm"><span className="font-semibold">{r.class?.name || r.lessonSession.title}</span><span className="ml-3 text-slate-500">{r.lessonSession.date.slice(0,10)} · {r.lessonSession.timeSlot}</span><span className={`ml-3 font-medium ${r.attendance==='ABSENT'?'text-rose-700':r.attendance==='LATE'?'text-amber-700':'text-emerald-700'}`}>{label(r.attendance)}{r.attendance==='LATE'?` · ${r.lateMinutes} min`:''}</span></summary><div className="mt-3 space-y-2 text-sm text-slate-600"><p>Teacher: {[r.teacher.firstName,r.teacher.lastName].filter(Boolean).join(' ') || 'Teacher'}</p>{r.lessonSession.topic && <p>Topic: {r.lessonSession.topic}</p>}<p>Performance: {r.performance?label(r.performance):'Not rated'} · Homework: {label(r.homeworkStatus)}</p>{r.feedback && <p className="whitespace-pre-wrap">Feedback: {r.feedback}</p>}{r.behaviorNote && <p className="whitespace-pre-wrap">Behavior: {r.behaviorNote}</p>}</div></details>)}</div>
    </>}
  </section>;
}
