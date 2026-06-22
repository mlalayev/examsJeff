import { Coins } from "lucide-react";
import Link from "next/link";

type CoinBalanceCardProps = {
  balance: number;
  loading?: boolean;
  href?: string;
  compact?: boolean;
};

export default function CoinBalanceCard({
  balance,
  loading = false,
  href = "/dashboard/student/coins",
  compact = false,
}: CoinBalanceCardProps) {
  const content = (
    <div
      className={`rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 ${
        compact ? "px-4 py-3" : "px-6 py-5"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-900/80 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-600" />
            Coin balance
          </p>
          {loading ? (
            <div className="h-8 w-16 bg-amber-200/60 rounded animate-pulse mt-2" />
          ) : (
            <p className={`font-bold text-amber-700 ${compact ? "text-2xl mt-1" : "text-4xl mt-2"}`}>
              {balance}
            </p>
          )}
          {!compact && (
            <p className="text-xs text-amber-800/60 mt-1">
              Earn coins by scoring 75%+ on exams
            </p>
          )}
        </div>
        {href && !loading && (
          <span className="text-xs font-medium text-amber-700 bg-white/70 border border-amber-100 rounded-lg px-3 py-1.5">
            View history →
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return <div>{content}</div>;
}
