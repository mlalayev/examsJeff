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
    subtotal: number;
    lines: {
      year: number;
      month: number;
      tuitionPaid: number;
      monthIndex: number;
      percent: number;
      commission: number;
    }[];
  }[];
};

export default function PartnerEarningsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<EarningsResponse | null>(null);
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
    fetch("/api/partner/earnings")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session, status, router]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-medium text-gray-900">Earnings</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Commission from accepted referrals based on paid tuition
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500">Loading...</div>
      ) : !data ? (
        <div className="text-center text-gray-500">Could not load earnings</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-md p-4">
              <p className="text-xs text-gray-500 uppercase">Total earned</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                {data.totalEarned.toFixed(2)} {data.currency}
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

          {data.breakdown.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-md p-8 text-center text-gray-500">
              No paid tuition linked to accepted referrals yet.
            </div>
          ) : (
            <div className="space-y-6">
              {data.breakdown.map((b) => (
                <div
                  key={b.referralId}
                  className="bg-white border border-gray-200 rounded-md overflow-hidden"
                >
                  <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{b.studentName}</p>
                      <p className="text-xs text-gray-500">{b.branchName}</p>
                    </div>
                    <p className="font-semibold text-emerald-700">
                      {b.subtotal.toFixed(2)} {data.currency}
                    </p>
                  </div>
                  {b.lines.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="px-4 py-2">Period</th>
                          <th className="px-4 py-2">Month #</th>
                          <th className="px-4 py-2">Tuition paid</th>
                          <th className="px-4 py-2">%</th>
                          <th className="px-4 py-2">Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {b.lines.map((l, i) => (
                          <tr key={i} className="border-b border-gray-50">
                            <td className="px-4 py-2">
                              {l.year}-{String(l.month).padStart(2, "0")}
                            </td>
                            <td className="px-4 py-2">{l.monthIndex}</td>
                            <td className="px-4 py-2">{l.tuitionPaid.toFixed(2)}</td>
                            <td className="px-4 py-2">{l.percent}%</td>
                            <td className="px-4 py-2 font-medium">
                              {l.commission.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="px-4 py-4 text-sm text-gray-500">No paid months yet</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
