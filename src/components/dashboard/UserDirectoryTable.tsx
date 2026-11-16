import type { ReactNode } from "react";
import { Users } from "lucide-react";
import { resolveStudyTypes, STUDY_TYPE_MAP, LESSON_MODE_MAP } from "@/lib/study-types";

export function directoryDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-GB");
}

export function DirectoryProgram({ program, studyTypes, lessonModes }: { program?: string | null; studyTypes?: string[]; lessonModes?: string[] }) {
  const types = resolveStudyTypes(studyTypes, program);
  return <div className="space-y-1.5">
    <div className="flex flex-wrap gap-1">{types.length ? types.map(id => {
      const type = STUDY_TYPE_MAP[id];
      return type ? <span key={id} className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${type.chip}`}>{type.label}</span> : null;
    }) : <span>{program || '—'}</span>}</div>
    {!!lessonModes?.length && <div className="flex flex-wrap gap-1">{lessonModes.map(id => {
      const mode = LESSON_MODE_MAP[id];
      return mode ? <span key={id} className={`rounded-full px-2 py-0.5 text-xs ring-1 ${mode.chip}`}>{mode.label}</span> : null;
    })}</div>}
  </div>;
}

export function DirectoryFee({ amount, status }: { amount?: number | string | null; status?: string }) {
  const fee = amount == null ? null : Number(amount);
  return <div className="space-y-1.5">
    <div className="tabular-nums">{fee != null && Number.isFinite(fee) ? `${fee.toFixed(2)} AZN` : "—"}</div>
    {status && <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : status === 'UNPAID' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
      {status === 'PAID' ? 'Paid this month' : status === 'UNPAID' ? 'Unpaid this month' : 'No payment record'}
    </span>}
  </div>;
}

export function DirectoryActions({ children }: { children: ReactNode }) {
  return <div className="flex min-w-[220px] max-w-[320px] flex-wrap items-center gap-1.5 [&>button]:inline-flex [&>button]:min-h-8 [&>button]:items-center [&>button]:gap-1.5 [&>button]:rounded-lg [&>button]:px-2.5 [&>button]:py-1.5 [&>button]:text-xs [&>button]:font-medium [&>button]:whitespace-nowrap">{children}</div>;
}

export default function UserDirectoryTable({ children, loading, empty, showFees = true, programLabel = "Program", emptyMessage = "No users found" }: {
  children: ReactNode; loading?: boolean; empty?: boolean; showFees?: boolean; programLabel?: string; emptyMessage?: string;
}) {
  const headings = ['User', programLabel, 'Branch', ...(showFees ? ['Monthly fee'] : []), 'Status', 'Joined', 'Actions'];
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table aria-label="User directory" aria-busy={loading || undefined} className="w-full min-w-[1000px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50"><tr>{headings.map(label => <th scope="col" key={label} className="whitespace-nowrap px-5 py-4 font-medium text-slate-600">{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? Array.from({ length: 5 }, (_, i) => <tr key={i}>{headings.map(label => <td key={label} className="px-5 py-5"><div className="h-4 w-20 animate-pulse rounded bg-slate-100"/></td>)}</tr>) : empty ? <tr><td colSpan={headings.length} className="px-5 py-14 text-center text-slate-500"><Users className="mx-auto mb-3 h-8 w-8 text-slate-300"/>{emptyMessage}</td></tr> : children}
        </tbody>
      </table>
    </div>
  </div>;
}

export function UserDirectoryRow({ name, email, program, branch, fee, status, joined, actions, showFees = true }: {
  name?: string | null; email: string; program: ReactNode; branch?: string | null; fee?: ReactNode; status: ReactNode; joined?: string | null; actions: ReactNode; showFees?: boolean;
}) {
  const cell = "px-5 py-4 align-middle text-slate-600";
  return <tr className="transition-colors hover:bg-slate-50/70">
    <td className={`${cell} min-w-[210px]`}><div className="font-medium text-slate-900">{name || email}</div><div className="mt-1 break-all text-xs text-slate-500">{email}</div></td>
    <td className={`${cell} min-w-[140px]`}>{program || '—'}</td>
    <td className={cell}>{branch || '—'}</td>
    {showFees && <td className={cell}>{fee || '—'}</td>}
    <td className={cell}><div className="flex flex-col items-start gap-1.5">{status}</div></td>
    <td className={`${cell} whitespace-nowrap tabular-nums`}>{directoryDate(joined)}</td>
    <td className={cell}>{actions}</td>
  </tr>;
}
