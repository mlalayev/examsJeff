"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";

type EarningsResponse = {
  summary: { inProgress: number; accepted: number; declined: number };
  totalEarned: number;
  currency: string;
  breakdown: {
    referralId: string;
    studentName: string;
    branchName: string;
    agreedMonthlyPrice: number | null;
    subtotal: number;
    lines: {
      year: number;
      month: number;
      tuitionPaid: number;
      monthIndex: number;
      percent: number;
      commission: number;
      source: "tuition" | "schedule";
    }[];
  }[];
  error?: string;
};

function formatAzn(value: number | null | undefined): string {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return n.toLocaleString("az-AZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PartnerEarningsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<EarningsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/login");
      return;
    }
    if ((session.user as { role?: string }).role !== "PARTNER") {
      router.push("/dashboard");
      return;
    }
    fetch("/api/partner/earnings", { cache: "no-store" })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) {
          setError(json.error || "Could not load earnings");
          setData(null);
          return;
        }
        setData({
          ...json,
          totalEarned: Number(json.totalEarned) || 0,
          breakdown: (json.breakdown ?? []).map((b: EarningsResponse["breakdown"][0]) => ({
            ...b,
            subtotal: Number(b.subtotal) || 0,
            agreedMonthlyPrice:
              b.agreedMonthlyPrice != null ? Number(b.agreedMonthlyPrice) : null,
            lines: (b.lines ?? []).map((l) => ({
              ...l,
              tuitionPaid: Number(l.tuitionPaid) || 0,
              commission: Number(l.commission) || 0,
              percent: Number(l.percent) || 0,
            })),
          })),
        });
        setError("");
      })
      .catch(() => setError("Could not load earnings"))
      .finally(() => setLoading(false));
  }, [session, status, router]);

  const currency = data?.currency ?? "AZN";
  const totalEarned = data?.totalEarned ?? 0;
  const breakdownWithEarnings =
    data?.breakdown.filter((b) => b.subtotal > 0 || b.lines.length > 0) ?? [];
  const breakdownPending =
    data?.breakdown.filter(
      (b) => b.subtotal === 0 && b.lines.length === 0 && b.agreedMonthlyPrice
    ) ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-medium text-gray-900">Earnings</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Commission from accepted referrals — calculated from paid tuition × your
          agreed percentage per month
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-600">{error}</div>
      ) : !data ? (
        <div className="text-center text-gray-500">Could not load earnings</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-md p-4 sm:col-span-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total earned</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  {formatAzn(totalEarned)}{" "}
                  <span className="text-base font-normal text-gray-600">{currency}</span>
                </span>
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-md p-4">
              <p className="text-xs text-gray-500 uppercase">In progress</p>
              <p className="text-2xl font-semibold text-amber-700 mt-1">
                {data.summary.inProgress}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-md p-4">
              <p className="text-xs text-gray-500 uppercase">Accepted</p>
              <p className="text-2xl font-semibold text-green-700 mt-1">
                {data.summary.accepted}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-md p-4">
              <p className="text-xs text-gray-500 uppercase">Declined</p>
              <p className="text-2xl font-semibold text-red-700 mt-1">
                {data.summary.declined}
              </p>
            </div>
          </div>

          {breakdownWithEarnings.length === 0 && breakdownPending.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-md p-8 text-center text-gray-500">
              No accepted referrals with commission yet. When a referral is accepted and
              tuition is marked paid, your earnings will appear here.
            </div>
          ) : (
            <div className="space-y-6">
              {breakdownWithEarnings.map((b) => (
                <div
                  key={b.referralId}
                  className="bg-white border border-gray-200 rounded-md overflow-hidden"
                >
                  <div className="px-4 py-3 border-b bg-gray-50 flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{b.studentName}</p>
                      <p className="text-xs text-gray-500">{b.branchName}</p>
                      {b.agreedMonthlyPrice != null && b.agreedMonthlyPrice > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Agreed tuition: {formatAzn(b.agreedMonthlyPrice)} {currency}/mo
                        </p>
                      )}
                    </div>
                    <p className="font-semibold text-emerald-700 text-lg">
                      {formatAzn(b.subtotal)} {currency}
                    </p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b bg-white">
                        <th className="px-4 py-2 font-medium">Period</th>
                        <th className="px-4 py-2 font-medium">Month #</th>
                        <th className="px-4 py-2 font-medium text-right">Base amount</th>
                        <th className="px-4 py-2 font-medium text-right">Rate</th>
                        <th className="px-4 py-2 font-medium text-right">Your commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {b.lines.map((l, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="px-4 py-2.5">
                            {l.year}-{String(l.month).padStart(2, "0")}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">{l.monthIndex}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {formatAzn(l.tuitionPaid)} {currency}
                          </td>
                          <td className="px-4 py-2.5 text-right">{l.percent}%</td>
                          <td className="px-4 py-2.5 text-right font-medium text-emerald-800 tabular-nums">
                            {formatAzn(l.commission)} {currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="px-4 py-2 text-right text-gray-600 font-medium">
                          Subtotal
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-emerald-800 tabular-nums">
                          {formatAzn(b.subtotal)} {currency}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ))}

              {breakdownPending.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <p className="text-sm font-medium text-amber-900 mb-2">
                    Waiting for paid tuition
                  </p>
                  <ul className="text-sm text-amber-800 space-y-1">
                    {breakdownPending.map((b) => (
                      <li key={b.referralId}>
                        {b.studentName} — agreed {formatAzn(b.agreedMonthlyPrice!)}{" "}
                        {currency}/mo (no paid months recorded yet)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
