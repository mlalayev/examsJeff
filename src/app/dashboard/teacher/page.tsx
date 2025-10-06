"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Users, ClipboardList, TrendingUp, Clock, UserCheck, FileText, BookOpen, CheckSquare } from "lucide-react";

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
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
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-sm text-gray-500 mt-1">No students yet</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <ClipboardList className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Pending Grading</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-sm text-gray-500 mt-1">All caught up!</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Graded Today</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-sm text-gray-500 mt-1">No submissions graded</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Avg Response Time</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">-</p>
          <p className="text-sm text-gray-500 mt-1">Not yet available</p>
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
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition text-left"
          >
            <div className="inline-flex p-3 bg-orange-50 rounded-lg mb-3">
              <CheckSquare className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Grade Submissions</h3>
            <p className="text-sm text-gray-500">Grade Writing & Speaking sections</p>
          </button>

          <button className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition text-left">
            <div className="inline-flex p-3 bg-green-50 rounded-lg mb-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">View Analytics</h3>
            <p className="text-sm text-gray-500">Track student progress</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="inline-flex p-4 bg-gray-50 rounded-full mb-4">
            <ClipboardList className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">No recent activity</p>
          <p className="text-sm text-gray-400 mt-1">
            Student submissions will appear here once they start taking exams
          </p>
        </div>
      </div>
    </div>
  );
}

