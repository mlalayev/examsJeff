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
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      href: "/dashboard/admin/students"
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals ?? 0,
      icon: CheckCircle,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      href: "/dashboard/admin/students?tab=pending"
    },
    {
      title: "Total Exams",
      value: stats?.totalExams ?? 0,
      icon: BookOpen,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      href: "/dashboard/admin/exams"
    },
    {
      title: "Active Exams",
      value: stats?.activeExams ?? 0,
      icon: FileText,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      href: "/dashboard/admin/exams?filter=active"
    },
    {
      title: "Total Attempts",
      value: stats?.totalAttempts ?? 0,
      icon: TrendingUp,
      color: "from-cyan-500 to-cyan-600",
      bgColor: "bg-cyan-50",
      href: "#"
    },
    {
      title: "Recent Attempts (24h)",
      value: stats?.recentAttempts ?? 0,
      icon: Clock,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      href: "#"
    }
  ];

  const quickActions = [
    {
      title: "Manage Students",
      description: "View, approve, and manage student accounts",
      href: "/dashboard/admin/students",
      icon: Users,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Manage Exams",
      description: "Create, edit, and upload exam content",
      href: "/dashboard/admin/exams",
      icon: BookOpen,
      color: "from-emerald-500 to-emerald-600"
    },
    {
      title: "Assign Exams",
      description: "Assign exams to students",
      href: "/dashboard/catalog",
      icon: FileText,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Seed Demo Data",
      description: "Generate demo exams and test data",
      href: "/dashboard/admin/seed",
      icon: CheckCircle,
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {session?.user?.name || session?.user?.email?.split('@')[0] || "Admin"}!
        </h1>
        <p className="text-gray-600">Manage students, exams, and platform content</p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                href={card.href}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`px-3 py-1 rounded-full ${card.bgColor} text-sm font-medium`}>
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
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link
                key={idx}
                href={action.href}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all group"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
