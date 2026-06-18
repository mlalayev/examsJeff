"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Search,
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
  approved: boolean;
  branch: { id: string; name: string } | null;
  recurringSlotCount: number;
  lessonCount: number;
  projectedLessons: number;
  totalHours: number;
  projectedHours: number;
  studentCount: number;
  payType: "PER_LESSON" | "HOURLY" | "FIXED";
  rate: number | null;
  fixedAmount: number | null;
  estimatedPay: number | null;
  payBasedOnActual: boolean;
};

type RecurringSlot = {
  id: string;
  title: string;
  timeSlot: string;
  className: string | null;
  studentCount: number;
};

type ScheduleData = {
  recurring: { oddDays: RecurringSlot[]; evenDays: RecurringSlot[] };
  classes: { id: string; name: string; studentCount: number }[];
  lessons: {
    id: string;
    title: string;
    date: string;
    timeSlot: string;
    hours: number;
    topic: string | null;
    className: string | null;
  }[];
};

export default function BossSalaryPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TeacherSalaryRow[]>([]);
  const [search, setSearch] = useState("");
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

  const [scheduleTeacher, setScheduleTeacher] =
    useState<TeacherSalaryRow | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<"recurring" | "lessons">(
    "recurring"
  );

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.branch?.name ?? "").toLowerCase().includes(q)
    );
  }, [rows, search]);

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
            payType === "FIXED"
              ? fixedAmount
                ? Number(fixedAmount)
                : null
              : null,
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

  const openSchedule = async (t: TeacherSalaryRow) => {
    setScheduleTeacher(t);
    setScheduleTab("recurring");
    setScheduleLoading(true);
    setScheduleData(null);
    try {
      const res = await fetch(
        `/api/boss/teachers/${t.id}/schedule?year=${year}&month=${month + 1}`
      );
      const data = await res.json();
      if (res.ok) {
        setScheduleData({
          recurring: data.recurring,
          classes: data.classes ?? [],
          lessons: data.lessons ?? [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScheduleLoading(false);
    }
  };

  const fmtAzn = (n: number | null) =>
    n != null ? `${n.toFixed(2)} AZN` : "—";

  const lessonsLabel = (t: TeacherSalaryRow) => {
    if (t.lessonCount > 0) return String(t.lessonCount);
    if (t.projectedLessons > 0)
      return `0 (${t.projectedLessons} scheduled)`;
    return "0";
  };

  const hoursLabel = (t: TeacherSalaryRow) => {
    if (t.totalHours > 0) return t.totalHours.toFixed(1);
    if (t.projectedHours > 0) return `0 (${t.projectedHours.toFixed(1)} sched.)`;
    return "0";
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher salary</h1>
          <p className="mt-1 text-sm text-gray-600">
            All teacher accounts — monthly lessons, schedules, and pay
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

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase text-slate-500">
            Teachers
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {rows.length}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase text-slate-500">
            Lessons held
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {totals.lessons}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase text-slate-500">
            Hours taught
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {totals.hours.toFixed(1)}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase text-slate-500">
            Total estimated pay
          </div>
          <div className="mt-1 text-2xl font-bold" style={{ color: ACCENT }}>
            {fmtAzn(totals.estimatedPay)}
          </div>
        </div>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teachers…"
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#303380] focus:ring-2 focus:ring-[#303380]/30"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading teachers…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            {rows.length === 0
              ? "No teacher accounts yet"
              : "No teachers match your search"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Teacher
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Branch
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">
                    Schedule
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">
                    Lessons
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">
                    Hours
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Pay type
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">
                    Est. salary
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {t.branch?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          t.approved
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {t.approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {t.recurringSlotCount > 0
                        ? `${t.recurringSlotCount} class${t.recurringSlotCount === 1 ? "" : "es"}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-900">
                      {lessonsLabel(t)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {hoursLabel(t)}
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
                    <td className="px-4 py-3 text-right">
                      <div className="font-semibold tabular-nums">
                        {fmtAzn(t.estimatedPay)}
                      </div>
                      {!t.payBasedOnActual && t.projectedLessons > 0 && (
                        <div className="text-[10px] text-slate-400">
                          from schedule
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openSchedule(t)}
                          className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-slate-50"
                        >
                          <Calendar className="h-3 w-3" />
                          Schedule
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

      {/* Pay settings modal */}
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
                  <option value="HOURLY">Hourly rate</option>
                  <option value="FIXED">Fixed monthly salary</option>
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
                    placeholder={
                      payType === "HOURLY" ? "Amount per hour" : "Amount per lesson"
                    }
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Fixed monthly salary (AZN)
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

      {/* Schedule modal */}
      {scheduleTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {scheduleTeacher.name} — schedule
                </h2>
                <p className="text-sm text-slate-500">
                  {MONTHS[month]} {year}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setScheduleTeacher(null)}
                className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-1 border-b border-slate-100 px-6 pt-2">
              {(["recurring", "lessons"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setScheduleTab(tab)}
                  className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                    scheduleTab === tab
                      ? "border-b-2 text-[#303380]"
                      : "text-slate-500 hover:text-gray-700"
                  }`}
                  style={
                    scheduleTab === tab
                      ? { borderColor: ACCENT, color: ACCENT }
                      : undefined
                  }
                >
                  {tab === "recurring" ? "Recurring classes" : "This month"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {scheduleLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading schedule…
                </div>
              ) : !scheduleData ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  Could not load schedule
                </p>
              ) : scheduleTab === "recurring" ? (
                <div className="space-y-6">
                  {(
                    [
                      ["Odd days", scheduleData.recurring.oddDays],
                      ["Even days", scheduleData.recurring.evenDays],
                    ] as const
                  ).map(([label, slots]) => (
                    <div key={label}>
                      <h3 className="mb-2 text-sm font-semibold text-gray-900">
                        {label}
                      </h3>
                      {slots.length === 0 ? (
                        <p className="text-sm text-slate-500">No classes</p>
                      ) : (
                        <ul className="space-y-2">
                          {slots.map((s) => (
                            <li
                              key={s.id}
                              className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2"
                            >
                              <div className="font-medium text-gray-900">
                                {s.title}
                                {s.className ? ` · ${s.className}` : ""}
                              </div>
                              <div className="text-xs text-slate-500">
                                {s.timeSlot}
                                {s.studentCount > 0 &&
                                  ` · ${s.studentCount} student${s.studentCount === 1 ? "" : "s"}`}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                  {scheduleData.classes.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-gray-900">
                        All classes
                      </h3>
                      <ul className="flex flex-wrap gap-2">
                        {scheduleData.classes.map((c) => (
                          <li
                            key={c.id}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs text-gray-700"
                          >
                            {c.name} ({c.studentCount})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : scheduleData.lessons.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  No lessons recorded this month yet.
                  {scheduleTeacher.projectedLessons > 0 &&
                    ` Schedule projects ${scheduleTeacher.projectedLessons} lessons if applied.`}
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase text-slate-500">
                      <th className="pb-2 pr-3">Date</th>
                      <th className="pb-2 pr-3">Time</th>
                      <th className="pb-2 pr-3">Class</th>
                      <th className="pb-2 text-right">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scheduleData.lessons.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2 pr-3 whitespace-nowrap">{l.date}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {l.timeSlot}
                        </td>
                        <td className="py-2 pr-3">
                          {l.className ?? l.title}
                          {l.topic && (
                            <span className="block text-xs text-slate-500">
                              {l.topic}
                            </span>
                          )}
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
