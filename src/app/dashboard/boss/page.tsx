"use client";

import { useEffect, useState } from "react";

interface KPI {
  branches: number;
  users: number;
  classes: number;
  bookings: number;
  attempts: number;
}

export default function BossDashboardPage() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/boss/overview");
        const data = await res.json();
        setKpis(data.kpis);
        setRecentBookings(data.recentBookings || []);
        setRecentUsers(data.recentUsers || []);
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
      </div>

      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KpiCard title="Branches" value={kpis.branches} />
          <KpiCard title="Users" value={kpis.users} />
          <KpiCard title="Classes" value={kpis.classes} />
          <KpiCard title="Bookings" value={kpis.bookings} />
          <KpiCard title="Attempts" value={kpis.attempts} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}


