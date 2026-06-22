"use client";

import { useState } from "react";
import { Coins, Loader2 } from "lucide-react";
import { AlertModal } from "@/components/modals/AlertModal";

export type CoinRewardItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coinCost: number;
  category: string;
  icon: string;
};

type CoinRewardsShopProps = {
  rewards: CoinRewardItem[];
  balance: number;
  loading?: boolean;
  onRedeemed: (balance: number) => void;
};

const CATEGORY_LABELS: Record<string, string> = {
  DRINK: "Drinks",
  FOOD: "Food & Snacks",
  DISCOUNT: "Discounts",
  OTHER: "Other",
};

export default function CoinRewardsShop({
  rewards,
  balance,
  loading = false,
  onRedeemed,
}: CoinRewardsShopProps) {
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error";
  }>({ isOpen: false, title: "", message: "", type: "success" });

  const grouped = rewards.reduce<Record<string, CoinRewardItem[]>>((acc, r) => {
    const key = r.category || "OTHER";
    acc[key] = acc[key] || [];
    acc[key].push(r);
    return acc;
  }, {});

  const handleRedeem = async (reward: CoinRewardItem) => {
    if (balance < reward.coinCost) {
      setAlert({
        isOpen: true,
        title: "Not enough coins",
        message: `You need ${reward.coinCost} coins but only have ${balance}.`,
        type: "error",
      });
      return;
    }

    if (
      !confirm(
        `Redeem "${reward.title}" for ${reward.coinCost} coins?\n\nThis will be deducted from your balance.`
      )
    ) {
      return;
    }

    setRedeemingId(reward.id);
    try {
      const res = await fetch(`/api/student/coin-rewards/${reward.id}/redeem`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to redeem reward");

      onRedeemed(data.balance);
      setAlert({
        isOpen: true,
        title: "Reward redeemed!",
        message: `"${reward.title}" has been added to your account. Show this to staff at the lounge.`,
        type: "success",
      });
    } catch (e) {
      setAlert({
        isOpen: true,
        title: "Redemption failed",
        message: e instanceof Error ? e.message : "Something went wrong",
        type: "error",
      });
    } finally {
      setRedeemingId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (rewards.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
        No rewards available right now. Check back soon!
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {CATEGORY_LABELS[category] || category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((reward) => {
                const canAfford = balance >= reward.coinCost;
                const isRedeeming = redeemingId === reward.id;

                return (
                  <div
                    key={reward.id}
                    className={`rounded-xl border bg-white p-4 flex flex-col shadow-sm transition ${
                      canAfford
                        ? "border-gray-200 hover:border-amber-200 hover:shadow-md"
                        : "border-gray-100 opacity-75"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-3xl leading-none" aria-hidden>
                        {reward.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-gray-900">{reward.title}</h4>
                        {reward.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {reward.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-700">
                        <Coins className="w-4 h-4" />
                        {reward.coinCost}
                      </span>
                      <button
                        type="button"
                        disabled={!canAfford || isRedeeming}
                        onClick={() => handleRedeem(reward)}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                      >
                        {isRedeeming ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Redeeming…
                          </>
                        ) : canAfford ? (
                          "Redeem"
                        ) : (
                          "Need more coins"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AlertModal
        isOpen={alert.isOpen}
        onClose={() => setAlert((a) => ({ ...a, isOpen: false }))}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </>
  );
}
