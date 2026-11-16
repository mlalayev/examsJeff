"use client";

import { useEffect, useState } from "react";
import { ContactRound, X, Wallet } from "lucide-react";
import StudentPaymentsModal from "./StudentPaymentsModal";

export default function UserDetailsButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState(false);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setUser(null); setError("");
    fetch(`/api/admin/users/${userId}`, { signal: controller.signal, cache: "no-store" })
      .then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error || "Could not load profile"); return data.user; })
      .then(data => { if (!controller.signal.aborted) setUser(data); })
      .catch(e => { if (!controller.signal.aborted) setError(e.message); });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => { controller.abort(); document.removeEventListener("keydown", onKey); };
  }, [open, userId]);
  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email : "User profile";
  const p = user?.profile;
  const fields = user ? [
    ["Email", user.email], ["Phone", p?.phoneNumber],
    ["Birthday", p?.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString("en-GB", { timeZone: "UTC" }) : null],
    ["Role", user.role], ["Program", p?.program],
    ["Study types", p?.studyTypes?.join(", ")], ["Lesson modes", p?.lessonModes?.join(", ")],
    ["Study status", p?.studyStatus], ["Monthly fee", p?.monthlyFee != null ? `${p.monthlyFee} AZN` : null],
    ["Coins", p?.coinBalance], ["Approval", user.approved ? "Approved" : "Pending"],
    ["Joined", new Date(user.createdAt).toLocaleDateString("en-GB")],
    ["Tags", user.tags?.join(", ")],
  ] : [];
  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-800 hover:bg-indigo-100"><ContactRound size={15}/>Profile</button>
    {open && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4" onClick={() => setOpen(false)}><section role="dialog" aria-modal="true" aria-label="User profile" onClick={e => e.stopPropagation()} className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white text-left shadow-xl"><header className="flex items-center justify-between border-b bg-slate-50 p-6"><div><h2 className="text-xl font-semibold text-slate-900">{name}</h2><p className="mt-1 text-sm text-slate-500">Profile</p></div><button type="button" aria-label="Close profile" onClick={() => setOpen(false)} className="rounded-lg border bg-white p-2"><X size={18}/></button></header><div className="p-6">{error ? <p role="alert" className="text-rose-700">{error}</p> : !user ? <p role="status">Loading profile…</p> : <><dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label as string}><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm text-slate-900">{value === null || value === undefined || value === '' ? '—' : value}</dd></div>)}</dl>{user.role === 'STUDENT' && <button type="button" onClick={() => { setOpen(false); setPayments(true); }} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#303380] px-4 py-3 text-sm font-medium text-white"><Wallet size={18}/>View payment history &amp; class fees</button>}</>}</div></section></div>}
    {payments && user && <StudentPaymentsModal studentId={userId} studentName={name} open={payments} onClose={() => setPayments(false)}/>}
  </>;
}
