"use client";
import { useEffect, useState } from 'react';
export type PaymentRow = {
    classId: string;
    className: string;
    studentId: string;
    name: string;
    teacherName: string;
    expected: number | null;
    paid: number;
    dueDate: string;
    paidAt: string | null;
    status: string;
    dueDay: number;
};
export const money = (n: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' AZN';
export default function ClassPaymentPanel({ studentId, year }: {
    studentId: string;
    year: number;
}) {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [rows, setRows] = useState<PaymentRow[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [version, setVersion] = useState(0);
    useEffect(() => { const abort = new AbortController(); setLoading(true); setRows([]); setError(''); fetch(`/api/branch/students/${studentId}/class-payments?year=${year}&month=${month}`, { signal: abort.signal, cache: 'no-store' }).then(async (r) => { const d = await r.json(); if (!r.ok)
        throw new Error(d.error); return d; }).then(d => { if (!abort.signal.aborted)
        setRows(d.rows); }).catch(e => { if (!abort.signal.aborted)
        setError(e.message); }).finally(() => { if (!abort.signal.aborted)
        setLoading(false); }); return () => abort.abort(); }, [studentId, year, month, version]);
    return <section className="my-4 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4"><div className="flex justify-between gap-3"><h3 className="font-semibold">Payments by class</h3><select aria-label="Class payment month" value={month} onChange={e => setMonth(Number(e.target.value))} className="rounded border bg-white p-1">{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(year, i, 1).toLocaleDateString('en-US', { month: 'long' })} {year}</option>)}</select></div><p className="my-2 text-xs text-slate-500">These amounts feed teacher revenue. Legacy monthly payments below are kept separately and are not counted again.</p>{error && <p role="alert" className="text-red-700">{error}</p>}{loading ? <p>Loading…</p> : !rows.length ? <p className="text-sm">No classes assigned for this month.</p> : rows.map(r => <PaymentEditor key={`${r.classId}-${month}-${version}`} row={r} year={year} month={month} onSaved={() => setVersion(v => v + 1)}/>)}</section>;
}
function PaymentEditor({ row, year, month, onSaved }: {
    row: PaymentRow;
    year: number;
    month: number;
    onSaved: () => void;
}) {
    const [expected, setExpected] = useState(row.expected === null ? '' : String(row.expected));
    const [paid, setPaid] = useState(String(row.paid));
    const [day, setDay] = useState(row.dueDay);
    const [defaults, setDefaults] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    async function save() { setBusy(true); setError(''); try {
        if (expected === '' || paid === '')
            throw new Error('Enter expected and paid amounts');
        const r = await fetch(`/api/branch/students/${row.studentId}/class-payments`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classId: row.classId, year, month, expected: Number(expected), paid: Number(paid), dueDay: day, setDefault: defaults }) });
        const d = await r.json();
        if (!r.ok)
            throw new Error(d.error || 'Could not save');
        onSaved();
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    return <fieldset disabled={busy} className="my-3 rounded-xl border bg-white p-3"><p className="font-medium">{row.className} <span className="text-xs text-slate-500">{row.teacherName}</span></p><div className="mt-2 grid grid-cols-3 gap-2">{[['Expected', expected, setExpected], ['Paid', paid, setPaid]].map(([name, value, setter]) => <label key={String(name)} className="text-xs">{String(name)} (AZN)<input type="number" min="0" step="0.01" value={value as string} onChange={e => (setter as (v: string) => void)(e.target.value)} className="mt-1 w-full rounded border p-2"/></label>)}<label className="text-xs">Payment day<input type="number" min="1" max="31" value={day} onChange={e => setDay(Number(e.target.value))} className="mt-1 w-full rounded border p-2"/></label></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><label className="text-xs"><input type="checkbox" checked={defaults} onChange={e => setDefaults(e.target.checked)}/> Use expected amount and day for future months</label><button type="button" onClick={save} className="rounded bg-[#303380] px-3 py-2 text-sm text-white">{busy ? 'Saving…' : 'Save class payment'}</button></div>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</fieldset>;
}
