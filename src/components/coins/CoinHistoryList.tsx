"use client";

import { Coins, TrendingDown, TrendingUp } from "lucide-react";

export type CoinTransactionItem = {
  id: string;
  amount: number;
  type: string;
  source: string;
  reason: string | null;
  examAttemptId?: string | null;
  createdAt: string;
  createdBy?: { name: string; email: string } | null;
};

type CoinHistoryListProps = {
  transactions: CoinTransactionItem[];
  loading?: boolean;
  emptyMessage?: string;
  showCreatedBy?: boolean;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSource(source: string) {
  return source.replace(/_/g, " ");
}

function formatType(type: string) {
  return type.replace(/_/g, " ");
}

export default function CoinHistoryList({
  transactions,
  loading = false,
  emptyMessage = "No coin transactions yet.",
  showCreatedBy = false,
}: CoinHistoryListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 rounded-lg bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Source</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Reason</th>
              {showCreatedBy && (
                <th className="px-4 py-3 text-left font-medium text-gray-500">Added by</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {transactions.map((tx) => {
              const positive = tx.amount > 0;
              return (
                <tr key={tx.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                    {formatDate(tx.createdAt)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        positive ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {positive ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {positive ? "+" : ""}
                      {tx.amount}
                    </span>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {formatType(tx.type)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-100">
                      <Coins className="w-3 h-3" />
                      {formatSource(tx.source)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs">
                    <span className="line-clamp-2">{tx.reason || "—"}</span>
                  </td>
                  {showCreatedBy && (
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {tx.createdBy?.name || "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
