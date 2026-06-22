"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/dashboard/student/PageHeader";
import CoinBalanceCard from "@/components/coins/CoinBalanceCard";
import CoinHistoryList, {
  type CoinTransactionItem,
} from "@/components/coins/CoinHistoryList";
import CoinRewardsShop, {
  type CoinRewardItem,
} from "@/components/coins/CoinRewardsShop";

export default function StudentCoinsPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CoinTransactionItem[]>([]);
  const [rewards, setRewards] = useState<CoinRewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rewardsLoading, setRewardsLoading] = useState(true);

  const loadCoins = useCallback(async () => {
    const res = await fetch("/api/student/coins");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load coins");
    setBalance(data.balance ?? 0);
    setTransactions(data.transactions ?? []);
  }, []);

  const loadRewards = useCallback(async () => {
    const res = await fetch("/api/student/coin-rewards");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load rewards");
    setRewards(data.rewards ?? []);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setRewardsLoading(true);
      try {
        await Promise.all([loadCoins(), loadRewards()]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setRewardsLoading(false);
      }
    };
    load();
  }, [loadCoins, loadRewards]);

  const handleRedeemed = async (newBalance: number) => {
    setBalance(newBalance);
    try {
      await loadCoins();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <PageHeader
        title="My Coins"
        description="Earn coins from exams and redeem them for drinks, snacks, and discounts."
      />

      <div className="mb-8">
        <CoinBalanceCard balance={balance} loading={loading} href="" />
      </div>

      <div className="mb-10">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Rewards shop</h2>
        <CoinRewardsShop
          rewards={rewards}
          balance={balance}
          loading={rewardsLoading}
          onRedeemed={handleRedeemed}
        />
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Transaction history</h2>
        <CoinHistoryList transactions={transactions} loading={loading} />
      </div>
    </div>
  );
}
