"use client";

import { useEffect, useState } from "react";
import { Coins, Loader2, X } from "lucide-react";

type ManualCoinModalProps = {
  open: boolean;
  studentId: string;
  studentName: string;
  initialBalance?: number | null;
  onClose: () => void;
  onSuccess?: (balance: number) => void;
};

export default function ManualCoinModal({
  open,
  studentId,
  studentName,
  initialBalance,
  onClose,
  onSuccess,
}: ManualCoinModalProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [balance, setBalance] = useState<number | null>(initialBalance ?? null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setReason("");
    setError("");
    setBalance(initialBalance ?? null);

    if (initialBalance != null) return;

    let cancelled = false;
    const loadBalance = async () => {
      setLoadingBalance(true);
      try {
        const res = await fetch(`/api/students/${studentId}/coins`);
        const data = await res.json();
        if (!cancelled && res.ok) {
          setBalance(data.balance ?? 0);
        }
      } catch {
        // non-blocking
      } finally {
        if (!cancelled) setLoadingBalance(false);
      }
    };
    loadBalance();
    return () => {
      cancelled = true;
    };
  }, [open, studentId, initialBalance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsedAmount = Number(amount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be a positive whole number");
      return;
    }
    if (reason.trim().length < 3) {
      setError("Reason must be at least 3 characters");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/students/${studentId}/coins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount, reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add coins");
        return;
      }
      setBalance(data.balance);
      onSuccess?.(data.balance);
      onClose();
    } catch {
      setError("Failed to add coins");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Coins className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Add Coins</h3>
              <p className="text-xs text-gray-500 truncate max-w-[240px]">{studentName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-sm text-amber-900">
            Current balance:{" "}
            {loadingBalance ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> loading…
              </span>
            ) : (
              <span className="font-semibold">{balance ?? 0}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              placeholder="e.g. 10"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none"
              placeholder="Why are you adding these coins?"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add Coins"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
