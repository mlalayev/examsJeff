"use client";

import { useEffect, useState } from "react";

interface KPI {
  branches: number;
  users: number;
  classes: number;
  bookings: number;
  attempts: number;
  students: number;
  paidPayments: number;
  unpaidPayments: number;
  thisMonthPaid: number;
  thisMonthTotal: number;
}

export default function BossDashboardPage() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/boss/overview");
        const data = await res.json();
        setKpis(data.kpis);
        setRecentBookings(data.recentBookings || []);
        setRecentUsers(data.recentUsers || []);
        setRecentPayments(data.recentPayments || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Boss Overview</h1>

      <div className="flex gap-3 mb-6">
        <a href="/dashboard/boss/branches" className="px-4 py-2 bg-blue-600 text-white rounded">Manage Branches</a>
        <a href="/dashboard/boss/users" className="px-4 py-2 bg-indigo-600 text-white rounded">Manage Users</a>
        <a href="/dashboard/boss/finance" className="px-4 py-2 bg-emerald-600 text-white rounded">Finance Analytics</a>
      </div>

      {kpis && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <KpiCard title="Branches" value={kpis.branches} />
            <KpiCard title="Total Users" value={kpis.users} />
            <KpiCard title="Students" value={kpis.students} />
            <KpiCard title="Classes" value={kpis.classes} />
            <KpiCard title="Attempts" value={kpis.attempts} />
          </div>

          {/* Payment Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard 
              title="Paid Payments" 
              value={kpis.paidPayments} 
              color="green"
            />
            <KpiCard 
              title="Unpaid Payments" 
              value={kpis.unpaidPayments} 
              color="red"
            />
            <KpiCard 
              title={`This Month Paid`}
              value={kpis.thisMonthPaid} 
              color="blue"
            />
            <KpiCard 
              title="This Month Total" 
              value={kpis.thisMonthTotal} 
              color="gray"
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Bookings</h2>
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">Start</th>
                  <th className="text-left px-3 py-2">Student</th>
                  <th className="text-left px-3 py-2">Exam</th>
                  <th className="text-left px-3 py-2">Teacher</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="px-3 py-2">{new Date(b.startAt).toLocaleString()}</td>
                    <td className="px-3 py-2">{b.student?.name || b.student?.email}</td>
                    <td className="px-3 py-2">{b.exam?.title}</td>
                    <td className="px-3 py-2">{b.teacher?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Users</h2>
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">Joined</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-3 py-2">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{u.name || "—"}</td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2">{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Recent Payments</h2>
        <div className="overflow-x-auto border rounded-lg bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Paid At</th>
                <th className="text-left px-3 py-2">Student</th>
                <th className="text-left px-3 py-2">Branch</th>
                <th className="text-left px-3 py-2">Year/Month</th>
                <th className="text-left px-3 py-2">Amount</th>
                <th className="text-left px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                    No payments recorded yet
                  </td>
                </tr>
              ) : (
                recentPayments.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-2">{p.student?.name || p.student?.email}</td>
                    <td className="px-3 py-2">{p.branch?.name || "—"}</td>
                    <td className="px-3 py-2">
                      {p.year}/{p.month.toString().padStart(2, '0')}
                    </td>
                    <td className="px-3 py-2">{parseFloat(p.amount).toFixed(2)} AZN</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        p.status === "PAID" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, color }: { title: string; value: number; color?: string }) {
  const colorClasses: Record<string, string> = {
    green: "border-green-200 bg-green-50",
    red: "border-red-200 bg-red-50",
    blue: "border-blue-200 bg-blue-50",
    gray: "border-gray-200 bg-gray-50",
  };

  const textColorClasses: Record<string, string> = {
    green: "text-green-700",
    red: "text-red-700",
    blue: "text-blue-700",
    gray: "text-gray-700",
  };

  const bgClass = color ? colorClasses[color] : "border-gray-200 bg-white";
  const textClass = color ? textColorClasses[color] : "text-gray-900";

  return (
    <div className={`p-4 border rounded-lg ${bgClass}`}>
      <div className="text-sm text-gray-600">{title}</div>
      <div className={`text-2xl font-semibold ${textClass}`}>{value}</div>
    </div>
  );
}


