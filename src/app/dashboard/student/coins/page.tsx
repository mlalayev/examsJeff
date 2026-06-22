"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/dashboard/student/PageHeader";
import CoinBalanceCard from "@/components/coins/CoinBalanceCard";
import CoinHistoryList, {
  type CoinTransactionItem,
} from "@/components/coins/CoinHistoryList";

export default function StudentCoinsPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CoinTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/student/coins");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load coins");
        setBalance(data.balance ?? 0);
        setTransactions(data.transactions ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <PageHeader
        title="My Coins"
        description="Track your coin balance and transaction history."
      />

      <div className="mb-8">
        <CoinBalanceCard balance={balance} loading={loading} href="" />
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Transaction history</h2>
        <CoinHistoryList transactions={transactions} loading={loading} />
      </div>
    </div>
  );
}
