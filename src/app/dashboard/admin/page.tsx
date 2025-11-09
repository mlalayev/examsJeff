"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Users, BookOpen, CheckCircle, Clock, TrendingUp, FileText } from "lucide-react";

interface Stats {
  totalStudents: number;
  pendingApprovals: number;
  totalExams: number;
  activeExams: number;
  totalAttempts: number;
  recentAttempts: number;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Students",
      value: stats?.totalStudents ?? 0,
      icon: Users,
      href: "/dashboard/admin/students"
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals ?? 0,
      icon: CheckCircle,
      href: "/dashboard/admin/students?tab=pending"
    },
    {
      title: "Total Exams",
      value: stats?.totalExams ?? 0,
      icon: BookOpen,
      href: "/dashboard/admin/exams"
    },
    {
      title: "Active Exams",
      value: stats?.activeExams ?? 0,
      icon: FileText,
      href: "/dashboard/admin/exams?filter=active"
    },
    {
      title: "Total Attempts",
      value: stats?.totalAttempts ?? 0,
      icon: TrendingUp,
      href: "#"
    },
    {
      title: "Recent Attempts (24h)",
      value: stats?.recentAttempts ?? 0,
      icon: Clock,
      href: "#"
    }
  ];

  const quickActions = [
    {
      title: "Manage Students",
      description: "View, approve, and manage student accounts",
      href: "/dashboard/admin/students",
      icon: Users
    },
    {
      title: "Manage Exams",
      description: "Create, edit, and upload exam content",
      href: "/dashboard/admin/exams",
      icon: BookOpen
    },
    {
      title: "Assign Exams",
      description: "Assign exams to students",
      href: "/dashboard/catalog",
      icon: FileText
    },
    {
      title: "Seed Demo Data",
      description: "Generate demo exams and test data",
      href: "/dashboard/admin/seed",
      icon: CheckCircle
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Minimal Header */}
      <div className="mb-8 sm:mb-12">
        <h1 className="text-xl sm:text-2xl font-medium text-gray-900 mb-1">
          Welcome, {session?.user?.name || session?.user?.email?.split('@')[0] || "Admin"}!
        </h1>
        <p className="text-gray-500 text-sm sm:text-base">Manage students, exams, and platform content</p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-md p-4 sm:p-6 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                href={card.href}
                className="bg-white rounded-md p-4 sm:p-6 border border-gray-200 hover:border-gray-300 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="text-lg sm:text-xl font-medium text-gray-900">
                    {card.value}
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg sm:text-xl font-medium text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link
                key={idx}
                href={action.href}
                className="bg-white rounded-md p-4 sm:p-6 border border-gray-200 hover:border-gray-300 transition"
              >
                <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-gray-700" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{action.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
