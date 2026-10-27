"use client";
import { useEffect, useRef, useState } from 'react';
import { money, type PaymentRow } from './ClassPaymentPanel';
export default function TeacherRevenueModal({ teacher, year, month, onClose }: {
    teacher: {
        id: string;
        name: string;
    };
    year: number;
    month: number;
    onClose: () => void;
}) {
    const dialog = useRef<HTMLDialogElement>(null);
    const [data, setData] = useState<{
        rows: PaymentRow[];
        expected: number;
        paid: number;
        unconfigured: number;
    } | null>(null);
    const [error, setError] = useState('');
    useEffect(() => { dialog.current?.showModal(); const abort = new AbortController(); setData(null); setError(''); fetch(`/api/boss/teachers/${teacher.id}/revenue?year=${year}&month=${month}`, { signal: abort.signal, cache: 'no-store' }).then(async (r) => { const d = await r.json(); if (!r.ok)
        throw new Error(d.error); return d; }).then(d => { if (!abort.signal.aborted)
        setData(d); }).catch(e => { if (!abort.signal.aborted)
        setError(e.message); }); return () => abort.abort(); }, [teacher.id, year, month]);
    const groups = [...new Set(data?.rows.map(r => r.classId) || [])];
    return <dialog ref={dialog} onCancel={onClose} onClose={onClose} className="m-auto max-h-[85vh] w-[calc(100%_-_2rem)] max-w-4xl overflow-y-auto rounded-2xl border bg-white p-6 text-slate-900 shadow-xl backdrop:bg-black/40"><header className="mb-5 flex justify-between gap-3"><div><h2 className="text-xl font-semibold">{teacher.name} — groups & revenue</h2><p className="text-sm text-slate-500">{new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p></div><button onClick={onClose} className="rounded border px-3">Close</button></header>{error ? <p role="alert">{error}</p> : !data ? <p>Loading…</p> : <><div className="grid gap-3 sm:grid-cols-3">{[['Expected', data.expected], ['Paid', data.paid], ['Remaining', Math.max(0, data.expected - data.paid)]].map(([name, amount]) => <div key={String(name)} className="rounded-xl bg-indigo-50 p-4"><p className="text-xs text-slate-500">{name}</p><strong className="text-xl">{money(Number(amount))}</strong></div>)}</div><p className="my-3 text-xs text-slate-500">{groups.length} groups · {new Set(data.rows.map(r => r.studentId)).size} students. Green: paid · Amber: partial · Red: overdue · Gray: pending / not set. Paid shows recorded payments for this billing month as of now.</p>{data.unconfigured > 0 && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm">{data.unconfigured} class fees are not set and are excluded from Expected. Set them in Users → Payments → Payments by class.</p>}{groups.map(id => { const rows = data.rows.filter(r => r.classId === id); return <section key={id} className="my-4 overflow-hidden rounded-xl border"><h3 className="bg-slate-50 p-3 font-semibold">{rows[0].className} · {rows.length} students</h3><div className="divide-y">{rows.map(r => <div key={r.studentId} className={`grid gap-2 p-3 text-sm sm:grid-cols-3 ${r.status === 'PAID' ? 'bg-emerald-50' : r.status === 'OVERDUE' ? 'bg-rose-50' : r.status === 'PARTIAL' ? 'bg-amber-50' : 'bg-white'}`}><div><strong>{r.name}</strong><p className="text-xs text-slate-500">Due: {r.dueDate} · {r.status.replace('_', ' ')}</p></div><div>Expected: {r.expected === null ? 'Not set' : money(r.expected)}</div><div>Paid: {money(r.paid)}{r.paidAt && <p className="text-xs text-slate-500">{new Date(r.paidAt).toLocaleDateString()}</p>}</div></div>)}</div></section>; })}{!groups.length && <p className="py-6 text-center">No groups or charges for this month.</p>}</>}</dialog>;
}
