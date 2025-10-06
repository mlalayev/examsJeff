"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  ClipboardList, 
  TrendingUp, 
  Clock, 
  UserCheck, 
  BookOpen, 
  CheckSquare,
  Calendar,
  ChevronRight,
  FileText,
  AlertCircle
} from "lucide-react";

interface OverviewData {
  stats: {
    classesCount: number;
    studentsCount: number;
    pendingGradingCount: number;
    upcomingBookingsCount: number;
    totalGraded: number;
    avgResponseTimeHours: number | null;
  };
  upcomingBookings: Array<{
    id: string;
    startAt: string;
    sections: string[];
    status: string;
    student: {
      id: string;
      name: string | null;
      email: string;
    };
    exam: {
      id: string;
      title: string;
      examType: string;
    };
    hasAttempt: boolean;
    attemptId?: string;
  }>;
  pendingGrading: Array<{
    sectionId: string;
    type: string;
    attemptId: string;
    student: {
      id: string;
      name: string | null;
      email: string;
    };
    exam: {
      id: string;
      title: string;
      examType: string;
    };
    submittedAt: string | null;
  }>;
}

export default function TeacherDashboard() {
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
      const response = await fetch("/api/teacher/overview");
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

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Recently";
    const hours = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
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
          Teacher Dashboard
        </h1>
        <p className="text-gray-600 mt-2">Welcome, {session?.user?.name}!</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Students</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.stats.studentsCount}</p>
          <p className="text-sm text-gray-500 mt-1">
            {data.stats.classesCount} {data.stats.classesCount === 1 ? "class" : "classes"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <ClipboardList className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Pending Grading</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.stats.pendingGradingCount}</p>
          <p className="text-sm text-gray-500 mt-1">
            {data.stats.pendingGradingCount === 0 ? "All caught up!" : "Needs attention"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Total Graded</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.stats.totalGraded}</p>
          <p className="text-sm text-gray-500 mt-1">Submissions reviewed</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Upcoming</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.stats.upcomingBookingsCount}</p>
          <p className="text-sm text-gray-500 mt-1">Scheduled exams</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => router.push("/dashboard/teacher/exams")}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition text-left"
          >
            <div className="inline-flex p-3 bg-blue-50 rounded-lg mb-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Manage Exams</h3>
            <p className="text-sm text-gray-500">Create and view exam templates</p>
          </button>

          <button 
            onClick={() => router.push("/dashboard/teacher/classes")}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition text-left"
          >
            <div className="inline-flex p-3 bg-purple-50 rounded-lg mb-3">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Manage Classes</h3>
            <p className="text-sm text-gray-500">Create classes and manage students</p>
          </button>

          <button 
            onClick={() => router.push("/dashboard/teacher/grading")}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition text-left relative"
          >
            {data.stats.pendingGradingCount > 0 && (
              <div className="absolute top-4 right-4 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                {data.stats.pendingGradingCount}
              </div>
            )}
            <div className="inline-flex p-3 bg-orange-50 rounded-lg mb-3">
              <CheckSquare className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Grade Submissions</h3>
            <p className="text-sm text-gray-500">Grade Writing & Speaking sections</p>
          </button>

          <button 
            onClick={() => router.push("/dashboard/teacher/analytics")}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition text-left"
          >
            <div className="inline-flex p-3 bg-green-50 rounded-lg mb-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">View Analytics</h3>
            <p className="text-sm text-gray-500">Track student progress</p>
          </button>
        </div>
      </div>

      {/* Pending Grading Alert */}
      {data.stats.pendingGradingCount > 0 && (
        <div className="mb-8 bg-orange-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-orange-600 rounded-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {data.stats.pendingGradingCount} {data.stats.pendingGradingCount === 1 ? "section" : "sections"} awaiting grading
              </h3>
              <p className="text-gray-700 mb-3">
                Students are waiting for feedback on their Writing and Speaking submissions.
              </p>
              <button
                onClick={() => router.push("/dashboard/teacher/grading")}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition flex items-center gap-2"
              >
                Grade Now
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Grading Quick List */}
      {data.pendingGrading.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Quick Grading</h2>
            <button
              onClick={() => router.push("/dashboard/teacher/grading")}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {data.pendingGrading.map((item) => (
              <div
                key={item.sectionId}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-lg transition"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <FileText className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {item.student.name || item.student.email} • {item.type}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {item.exam.title} • {getTimeAgo(item.submittedAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/dashboard/teacher/grading/${item.sectionId}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
                >
                  Grade
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Bookings */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Upcoming Exams</h2>
          {data.upcomingBookings.length > 0 && (
            <button
              onClick={() => router.push("/dashboard/teacher/bookings")}
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
              Assign exams to your students to see them here.
            </p>
            <button
              onClick={() => router.push("/dashboard/teacher/classes")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Go to Classes
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sections
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.upcomingBookings.slice(0, 5).map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-50 rounded-lg mr-3">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.student.name || booking.student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{booking.exam.title}</div>
                      <div className="text-xs text-gray-500">{booking.exam.examType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDateTime(booking.startAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {booking.sections.slice(0, 2).map((section) => (
                          <span
                            key={section}
                            className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium"
                          >
                            {section.charAt(0)}
                          </span>
                        ))}
                        {booking.sections.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{booking.sections.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
