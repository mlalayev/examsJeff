"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BranchAdminDashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/branch-admin/overview");
      const data = await res.json();
      setOverview(data);
    } catch (error) {
      console.error("Failed to load overview:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Branch Admin Dashboard</h1>
          {overview?.branchName && (
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              Managing: {overview.branchName}
            </span>
          )}
        </div>
        <p className="text-gray-600">Manage your branch's students, teachers, and classes</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Students</h3>
          <p className="text-3xl font-bold text-blue-600">{overview?.totalStudents || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Teachers</h3>
          <p className="text-3xl font-bold text-green-600">{overview?.totalTeachers || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Active Classes</h3>
          <p className="text-3xl font-bold text-purple-600">{overview?.activeClasses || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Approvals</h3>
          <p className="text-3xl font-bold text-amber-600">{overview?.pendingApprovals || 0}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/branch-admin/students"
            className="bg-blue-50 hover:bg-blue-100 p-6 rounded-lg border border-blue-200 transition-colors"
          >
            <div className="flex items-center">
              <div className="bg-blue-500 text-white p-3 rounded-lg mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Students</h3>
                <p className="text-sm text-gray-600">View and manage students in your branch</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/branch-admin/classes"
            className="bg-green-50 hover:bg-green-100 p-6 rounded-lg border border-green-200 transition-colors"
          >
            <div className="flex items-center">
              <div className="bg-green-500 text-white p-3 rounded-lg mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Classes</h3>
                <p className="text-sm text-gray-600">View and manage classes in your branch</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/branch-admin/enrollments"
            className="bg-purple-50 hover:bg-purple-100 p-6 rounded-lg border border-purple-200 transition-colors"
          >
            <div className="flex items-center">
              <div className="bg-purple-500 text-white p-3 rounded-lg mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Course Enrollments</h3>
                <p className="text-sm text-gray-600">Manage student course enrollments</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/branch-admin/payments"
            className="bg-indigo-50 hover:bg-indigo-100 p-6 rounded-lg border border-indigo-200 transition-colors"
          >
            <div className="flex items-center">
              <div className="bg-indigo-500 text-white p-3 rounded-lg mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Payment Management</h3>
                <p className="text-sm text-gray-600">Track and manage student payments</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/branch-admin/approvals"
            className="bg-amber-50 hover:bg-amber-100 p-6 rounded-lg border border-amber-200 transition-colors"
          >
            <div className="flex items-center">
              <div className="bg-amber-500 text-white p-3 rounded-lg mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Pending Approvals</h3>
                <p className="text-sm text-gray-600">Review and approve new users</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Students</h3>
          {overview?.recentStudents && overview.recentStudents.length > 0 ? (
            <div className="space-y-3">
              {overview.recentStudents.map((student: any) => (
                <div key={student.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{student.name || "—"}</p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    student.approved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {student.approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent students</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Classes</h3>
          {overview?.recentClasses && overview.recentClasses.length > 0 ? (
            <div className="space-y-3">
              {overview.recentClasses.map((classItem: any) => (
                <div key={classItem.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{classItem.name}</p>
                    <p className="text-sm text-gray-500">Teacher: {classItem.teacher?.name || "—"}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {classItem._count?.classStudents || 0} students
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent classes</p>
          )}
        </div>
      </div>
    </div>
  );
}
