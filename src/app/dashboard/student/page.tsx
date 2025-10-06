"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Calendar, 
  Award, 
  TrendingUp, 
  BookOpen, 
  Clock,
  ChevronRight,
  FileText,
  Target,
  Zap
} from "lucide-react";

interface OverviewData {
  upcomingBookings: Array<{
    id: string;
    startAt: string;
    sections: string[];
    status: string;
    exam: {
      id: string;
      title: string;
      examType: string;
    };
    teacher: {
      id: string;
      name: string | null;
      email: string;
    } | null;
    hasAttempt: boolean;
    attemptId?: string;
  }>;
  recentAttempts: Array<{
    id: string;
    bandOverall: number | null;
    submittedAt: string | null;
    exam: {
      id: string;
      title: string;
      examType: string;
    };
    sections: Array<{
      type: string;
      bandScore: number | null;
      rawScore: number | null;
    }>;
  }>;
  stats: {
    totalAttempts: number;
    averageBand: number | null;
    streak: number;
    upcomingCount: number;
  };
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchOverview();
    }
  }, [session]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/student/overview");
      if (!response.ok) throw new Error("Failed to fetch overview");
      const overviewData = await response.json();
      setData(overviewData);
    } catch (error) {
      console.error("Error fetching overview:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      timeZone: "Asia/Baku",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBandColor = (band: number) => {
    if (band >= 8) return "text-green-600 bg-green-50";
    if (band >= 7) return "text-blue-600 bg-blue-50";
    if (band >= 6) return "text-purple-600 bg-purple-50";
    if (band >= 5) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-800">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">Track your progress and upcoming exams</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Total Exams</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.stats.totalAttempts}</p>
          <p className="text-sm text-gray-500 mt-1">Completed attempts</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Average Band</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {data.stats.averageBand?.toFixed(1) || "—"}
          </p>
          <p className="text-sm text-gray-500 mt-1">Overall performance</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Upcoming</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.stats.upcomingCount}</p>
          <p className="text-sm text-gray-500 mt-1">Scheduled exams</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Activity</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.stats.streak}</p>
          <p className="text-sm text-gray-500 mt-1">Days active (30d)</p>
        </div>
      </div>

      {/* Upcoming Exams */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Upcoming Exams</h2>
          {data.upcomingBookings.length > 0 && (
            <button
              onClick={() => router.push("/dashboard/student/bookings")}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {data.upcomingBookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming exams</h3>
            <p className="text-gray-600 mb-6">
              You don't have any scheduled exams. Contact your teacher to book a mock test.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{booking.exam.title}</h3>
                        <p className="text-sm text-gray-600">
                          {booking.teacher?.name || booking.teacher?.email || "No teacher"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDateTime(booking.startAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>{booking.sections.join(", ")}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {booking.sections.map((section) => (
                        <span
                          key={section}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {section}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="ml-4">
                    {booking.hasAttempt ? (
                      <button
                        onClick={() => router.push(`/dashboard/student/results/${booking.attemptId}`)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
                      >
                        View Results
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push(`/attempt/${booking.id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
                      >
                        Start Exam
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Results */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Results</h2>
        </div>

        {data.recentAttempts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No results yet</h3>
            <p className="text-gray-600">
              Complete your first exam to see your results here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.recentAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition cursor-pointer"
                onClick={() => router.push(`/dashboard/student/results/${attempt.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{attempt.exam.title}</h3>
                    <p className="text-sm text-gray-600">
                      {attempt.submittedAt
                        ? formatDateTime(attempt.submittedAt)
                        : "Recently submitted"}
                    </p>
                  </div>
                  {attempt.bandOverall !== null && (
                    <div
                      className={`px-4 py-2 rounded-xl font-bold text-2xl ${getBandColor(
                        attempt.bandOverall
                      )}`}
                    >
                      {attempt.bandOverall.toFixed(1)}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {attempt.sections.map((section) => (
                    <div key={section.type} className="text-center">
                      <p className="text-xs text-gray-600 mb-1">{section.type.charAt(0)}</p>
                      <p className="text-lg font-bold text-gray-900">
                        {section.bandScore?.toFixed(1) || "—"}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-end text-blue-600 text-sm font-medium">
                  View Details
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress Tip */}
      {data.stats.totalAttempts > 0 && data.stats.averageBand && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Keep up the great work!</h3>
              <p className="text-gray-700">
                Your current average is <strong>{data.stats.averageBand.toFixed(1)}</strong>.
                {data.stats.averageBand < 7 && " Practice regularly to reach band 7 and above!"}
                {data.stats.averageBand >= 7 && data.stats.averageBand < 8 && " You're doing great! Keep practicing to reach band 8!"}
                {data.stats.averageBand >= 8 && " Excellent performance! You're in the top tier!"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
