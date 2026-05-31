"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type PaymentRow = {
  month: number;
  id: string | null;
  amount: number;
  status: "PAID" | "UNPAID" | string;
  paidAt: string | null;
  note: string | null;
  exists: boolean;
};

type StudentPaymentsModalProps = {
  studentId: string;
  studentName: string;
  open: boolean;
  onClose: () => void;
  /** Called after a successful save so callers can refresh totals */
  onChanged?: () => void;
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatAzn(value: number): string {
  return new Intl.NumberFormat("az-AZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function StudentPaymentsModal({
  studentId,
  studentName,
  open,
  onClose,
  onChanged,
}: StudentPaymentsModalProps) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [defaultFee, setDefaultFee] = useState<number>(0);
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingMonth, setSavingMonth] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [editAmount, setEditAmount] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/branch/students/${studentId}/payments?year=${year}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load payments");
        setRows([]);
        return;
      }
      setRows(data.payments ?? []);
      setDefaultFee(Number(data.defaultFee ?? 0));
      const next: Record<number, string> = {};
      for (const r of data.payments ?? []) {
        next[r.month] = String(r.amount ?? data.defaultFee ?? 0);
      }
      setEditAmount(next);
    } catch (e) {
      setError("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [studentId, year]);

  useEffect(() => {
    if (!open) return;
    load();
  }, [open, load]);

  if (!open) return null;

  const totalPaid = rows
    .filter((r) => r.status === "PAID")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const paidCount = rows.filter((r) => r.status === "PAID").length;

  async function persist(month: number, paid: boolean, amount: number, note?: string) {
    setSavingMonth(month);
    setError("");
    try {
      const res = await fetch(
        `/api/branch/students/${studentId}/payments/mark`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year, month, paid, amount, note }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update payment");
        return;
      }
      await load();
      onChanged?.();
    } catch (e) {
      setError("Failed to update payment");
    } finally {
      setSavingMonth(null);
    }
  }

  async function togglePaid(row: PaymentRow) {
    const willPay = row.status !== "PAID";
    const raw = editAmount[row.month];
    const parsed = Number(raw);
    const amount =
      Number.isFinite(parsed) && parsed > 0
        ? parsed
        : Number(row.amount) > 0
          ? Number(row.amount)
          : defaultFee;
    if (willPay && (!Number.isFinite(amount) || amount <= 0)) {
      setError("Set a payment amount before marking as paid");
      return;
    }
    await persist(row.month, willPay, amount, row.note ?? undefined);
  }

  async function saveAmount(row: PaymentRow) {
    const raw = editAmount[row.month];
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Enter a valid amount");
      return;
    }
    const stayPaid = row.status === "PAID";
    await persist(row.month, stayPaid, amount, row.note ?? undefined);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Monthly payments</h2>
            <p className="text-sm text-gray-500">{studentName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              className="p-1.5 border border-gray-200 rounded hover:bg-gray-50"
              aria-label="Previous year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 border border-gray-200 rounded text-sm font-medium min-w-[80px] text-center">
              {year}
            </div>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              className="p-1.5 border border-gray-200 rounded hover:bg-gray-50"
              aria-label="Next year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm text-gray-600 flex gap-4 flex-wrap">
            <span>
              Default fee:{" "}
              <span className="font-medium text-gray-900">
                {formatAzn(defaultFee)} AZN
              </span>
            </span>
            <span>
              Paid in {year}:{" "}
              <span className="font-medium text-emerald-700">
                {formatAzn(totalPaid)} AZN
              </span>{" "}
              ({paidCount}/12)
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-700 w-28">
                      Month
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">
                      Amount (AZN)
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">
                      Status
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">
                      Paid at
                    </th>
                    <th className="text-right px-4 py-2 font-medium text-gray-700 w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => {
                    const isPaid = row.status === "PAID";
                    const busy = savingMonth === row.month;
                    return (
                      <tr key={row.month} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900">
                          {MONTH_NAMES[row.month - 1]}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editAmount[row.month] ?? ""}
                              onChange={(e) =>
                                setEditAmount((prev) => ({
                                  ...prev,
                                  [row.month]: e.target.value,
                                }))
                              }
                              className="w-28 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
                              disabled={busy}
                            />
                            <button
                              type="button"
                              onClick={() => saveAmount(row)}
                              disabled={busy}
                              className="text-xs text-[#303380] hover:underline disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              isPaid
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {isPaid ? "Paid" : "Unpaid"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 text-xs">
                          {row.paidAt
                            ? new Date(row.paidAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => togglePaid(row)}
                            disabled={busy}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium border transition disabled:opacity-50 ${
                              isPaid
                                ? "border-orange-200 text-orange-700 hover:bg-orange-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {busy ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : isPaid ? null : (
                              <Check className="w-3 h-3" />
                            )}
                            {isPaid ? "Mark unpaid" : "Mark paid"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white rounded-md"
            style={{ backgroundColor: "#303380" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
