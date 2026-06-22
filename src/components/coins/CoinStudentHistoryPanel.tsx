"use client";

import { useEffect, useState } from "react";
import CoinHistoryList, {
  type CoinTransactionItem,
} from "@/components/coins/CoinHistoryList";

type CoinStudentHistoryPanelProps = {
  studentId: string;
  showCreatedBy?: boolean;
  refreshToken?: number;
};

export default function CoinStudentHistoryPanel({
  studentId,
  showCreatedBy = true,
  refreshToken = 0,
}: CoinStudentHistoryPanelProps) {
  const [transactions, setTransactions] = useState<CoinTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/students/${studentId}/coins?history=true`
        );
        const data = await res.json();
        if (!cancelled && res.ok) {
          setTransactions(data.transactions ?? []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [studentId, refreshToken]);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Coin history</h3>
      <CoinHistoryList
        transactions={transactions}
        loading={loading}
        showCreatedBy={showCreatedBy}
        emptyMessage="No coin transactions for this student yet."
      />
    </div>
  );
}
