"use client";
import { useEffect, useState } from "react";
import { STUDY_TYPES } from "@/lib/study-types";

export type TeacherRow = { teacherId: string; subjects: string[]; fee: string };
export function assignmentPayload(rows: TeacherRow[]) {
  return rows.map(({teacherId, subjects, fee}) => ({teacherId, subjects, monthlyFee: fee.trim() ? Number(fee) : null}));
}

export default function StudentTeachers({branchId, rows, onChange}: {
  branchId: string; rows: TeacherRow[]; onChange: (rows: TeacherRow[]) => void;
}) {
  const [teachers, setTeachers] = useState<{id:string;name:string}[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    onChange([]);
    setTeachers([]);
    setError("");
    if (!branchId) return;
    const abort = new AbortController();
    fetch("/api/branch/teachers?branchId=" + encodeURIComponent(branchId), {signal:abort.signal})
      .then(async r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { if (!abort.signal.aborted) setTeachers(data.teachers); })
      .catch(() => { if (!abort.signal.aborted) setError("Could not load teachers for this branch."); });
    return () => abort.abort();
  }, [branchId, onChange]);
  const update = (i:number, change:Partial<TeacherRow>) => onChange(rows.map((row,index)=>index===i ? {...row,...change} : row));
  return <section className="my-4 rounded-xl border bg-slate-50 p-4">
    <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">Teachers <small className="font-normal text-slate-500">(optional)</small></h3>
      <button type="button" disabled={!branchId || rows.length >= teachers.length} className="rounded border bg-white px-3 py-1 disabled:opacity-50" onClick={()=>onChange([...rows,{teacherId:"",subjects:[],fee:""}])}>+ Add teacher</button></div>
    <p className="text-xs text-slate-600">{branchId ? "Set one monthly fee per teacher for the selected subjects." : "Choose a branch to add teachers."}</p>
    {error && <p role="alert">{error}</p>}
    {rows.map((row,i)=><div key={i} className="mt-3 space-y-2 rounded-lg border bg-white p-3">
      <label className="block text-sm">Teacher<select required className="block w-full rounded border p-2" value={row.teacherId} onChange={e=>update(i,{teacherId:e.target.value})}>
        <option value="">Choose a teacher</option>{teachers.map(t=><option key={t.id} value={t.id} disabled={rows.some((r,j)=>j!==i && r.teacherId===t.id)}>{t.name}</option>)}</select></label>
      <fieldset><legend className="text-sm">Subjects</legend><div className="flex flex-wrap gap-1">{STUDY_TYPES.map(s=><button type="button" key={s.id} aria-pressed={row.subjects.includes(s.id)} className={row.subjects.includes(s.id)?"rounded bg-indigo-800 px-2 py-1 text-xs text-white":"rounded border px-2 py-1 text-xs"} onClick={()=>update(i,{subjects:row.subjects.includes(s.id)?row.subjects.filter(id=>id!==s.id):[...row.subjects,s.id]})}>{s.label}</button>)}</div></fieldset>
      <div className="flex items-end justify-between"><label className="text-sm">Monthly fee (AZN)<input className="block w-32 rounded border p-2" required type="number" min="0" max="99999999.99" step="0.01" value={row.fee} onChange={e=>update(i,{fee:e.target.value})}/></label>
      <button type="button" className="text-sm text-red-700" onClick={()=>onChange(rows.filter((_,j)=>i!==j))}>Remove</button></div>
    </div>)}
  </section>;
}
