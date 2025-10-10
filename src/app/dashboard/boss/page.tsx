"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded-lg w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="h-4 bg-slate-200 rounded w-24 mb-3"></div>
                  <div className="h-8 bg-slate-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200/30 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-indigo-200/30 rounded-full blur-xl animate-pulse delay-2000"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          {/* Welcome Message */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-white/20 mb-8">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">J</span>
              </div>
              <span className="text-slate-700 font-medium">JEFF Exams Portal</span>
            </div>
            
            <h1 className="text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Welcome Back, 
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {session?.user?.name || session?.user?.email?.split('@')[0] || "Boss"}!
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Your command center for managing the entire JEFF Exams ecosystem. 
              Monitor performance, track growth, and make data-driven decisions.
            </p>
          </div>

        </div>
      </div>

      {/* Navigation Hint */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-600 text-sm">
            <span>💡</span>
            <span>Use the sidebar to navigate between different sections</span>
          </div>
        </div>
      </div>

    </div>
  );
}



