import { Coins, Sparkles } from "lucide-react";

type ExamCoinRewardBannerProps = {
  amount: number;
  className?: string;
};

export function ExamCoinRewardBanner({
  amount,
  className = "",
}: ExamCoinRewardBannerProps) {
  return (
    <div
      className={`rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-5 py-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <Coins className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            You earned +{amount} coins for scoring 75%+
          </p>
          <p className="text-sm text-amber-800/80 mt-1">
            Great job! Your coins have been added to your balance.
          </p>
        </div>
      </div>
    </div>
  );
}
