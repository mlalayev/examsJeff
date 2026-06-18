"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  X,
} from "lucide-react";
import { PAY_TYPE_LABELS } from "@/lib/teacher-salary";

const ACCENT = "#303380";
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type TeacherSalaryRow = {
  id: string;
  name: string;
  email: string;
  branch: { id: string; name: string } | null;
  lessonCount: number;
  totalHours: number;
  studentCount: number;
  payType: "PER_LESSON" | "HOURLY" | "FIXED";
  rate: number | null;
  fixedAmount: number | null;
  estimatedPay: number | null;
};

type LessonRow = {
  id: string;
  title: string;
  date: string;
  timeSlot: string;
  hours: number;
  topic: string | null;
  className: string | null;
  studentRecordCount: number;
};

export default function BossSalaryPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TeacherSalaryRow[]>([]);
  const [totals, setTotals] = useState({
    lessons: 0,
    hours: 0,
    estimatedPay: 0,
  });

  const [editTeacher, setEditTeacher] = useState<TeacherSalaryRow | null>(null);
  const [payType, setPayType] = useState<"PER_LESSON" | "HOURLY" | "FIXED">(
    "PER_LESSON"
  );
  const [rate, setRate] = useState("");
  const [fixedAmount, setFixedAmount] = useState("");
  const [savingPay, setSavingPay] = useState(false);

  const [detailTeacher, setDetailTeacher] = useState<TeacherSalaryRow | null>(
    null
  );
  const [detailLessons, setDetailLessons] = useState<LessonRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/boss/salary?year=${year}&month=${month + 1}`
      );
      const data = await res.json();
      if (res.ok) {
        setRows(data.teachers ?? []);
        setTotals(data.totals ?? { lessons: 0, hours: 0, estimatedPay: 0 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const openEditPay = (t: TeacherSalaryRow) => {
    setEditTeacher(t);
    setPayType(t.payType);
    setRate(t.rate != null ? String(t.rate) : "");
    setFixedAmount(t.fixedAmount != null ? String(t.fixedAmount) : "");
  };

  const savePay = async () => {
    if (!editTeacher) return;
    setSavingPay(true);
    try {
      const res = await fetch(`/api/boss/teachers/${editTeacher.id}/pay`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payType,
          rate: payType === "FIXED" ? null : rate ? Number(rate) : null,
          fixedAmount:
            payType === "FIXED" ? (fixedAmount ? Number(fixedAmount) : null) : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save");
      }
      setEditTeacher(null);
      await load();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSavingPay(false);
    }
  };

  const openDetails = async (t: TeacherSalaryRow) => {
    setDetailTeacher(t);
    setDetailLoading(true);
    setDetailLessons([]);
    try {
      const res = await fetch(
        `/api/boss/teachers/${t.id}/lessons?year=${year}&month=${month + 1}`
      );
      const data = await res.json();
      if (res.ok) setDetailLessons(data.lessons ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const fmtAzn = (n: number | null) =>
    n != null ? `${n.toFixed(2)} AZN` : "—";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher salary</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monthly lessons and estimated pay per teacher
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[140px] text-center text-sm font-semibold text-gray-900">
            {MONTHS[month]} {year}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase text-slate-500">
            Total lessons
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {totals.lessons}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase text-slate-500">
            Total hours
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {totals.hours.toFixed(1)}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase text-slate-500">
            Estimated pay
          </div>
          <div className="mt-1 text-2xl font-bold" style={{ color: ACCENT }}>
            {fmtAzn(totals.estimatedPay)}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            No teachers found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Teacher
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Branch
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">
                    Lessons
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">
                    Hours
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">
                    Students
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Pay type
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">
                    Est. pay
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {t.branch?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {t.lessonCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {t.totalHours.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {t.studentCount}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {PAY_TYPE_LABELS[t.payType]}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {t.payType === "FIXED"
                        ? fmtAzn(t.fixedAmount)
                        : t.rate != null
                        ? `${t.rate.toFixed(2)} AZN`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {fmtAzn(t.estimatedPay)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openDetails(t)}
                          className="text-xs font-medium text-[#303380] hover:underline"
                        >
                          Lessons
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditPay(t)}
                          className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3 w-3" />
                          Pay
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Pay settings
                </h2>
                <p className="text-sm text-slate-500">{editTeacher.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditTeacher(null)}
                className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Pay type
                </label>
                <select
                  value={payType}
                  onChange={(e) =>
                    setPayType(
                      e.target.value as "PER_LESSON" | "HOURLY" | "FIXED"
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="PER_LESSON">Per lesson</option>
                  <option value="HOURLY">Hourly</option>
                  <option value="FIXED">Fixed monthly</option>
                </select>
              </div>
              {payType !== "FIXED" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Rate (AZN)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder={payType === "HOURLY" ? "Per hour" : "Per lesson"}
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Fixed monthly amount (AZN)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditTeacher(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePay}
                disabled={savingPay}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: ACCENT }}
              >
                {savingPay && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {detailTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {detailTeacher.name} — {MONTHS[month]} {year}
                </h2>
                <p className="text-sm text-slate-500">
                  {detailTeacher.lessonCount} lessons ·{" "}
                  {detailTeacher.totalHours.toFixed(1)} hours
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailTeacher(null)}
                className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {detailLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading lessons…
                </div>
              ) : detailLessons.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  No lessons this month
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase text-slate-500">
                      <th className="pb-2 pr-3">Date</th>
                      <th className="pb-2 pr-3">Time</th>
                      <th className="pb-2 pr-3">Class</th>
                      <th className="pb-2 pr-3">Topic</th>
                      <th className="pb-2 text-right">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailLessons.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2 pr-3 whitespace-nowrap">{l.date}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {l.timeSlot}
                        </td>
                        <td className="py-2 pr-3">{l.className ?? l.title}</td>
                        <td className="py-2 pr-3 text-slate-600">
                          {l.topic ?? "—"}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {l.hours.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
