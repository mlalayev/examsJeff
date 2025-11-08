"use client";

import { useEffect, useState } from "react";
import { Users, Search } from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

interface Student {
  id: string;
  name: string | null;
  email: string;
  approved: boolean;
  createdAt: string;
  branchId: string | null;
  branch: {
    id: string;
    name: string;
  } | null;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterApproved, setFilterApproved] = useState<boolean | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, [filterApproved]);

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (filterApproved !== null) {
        params.append("approved", filterApproved.toString());
      }
      const res = await fetch(`/api/admin/students?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (studentId: string, approve: boolean) => {
    setUpdating(studentId);
    try {
      const res = await fetch(`/api/admin/students/${studentId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: approve })
      });

      if (res.ok) {
        await fetchStudents();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update approval status");
      }
    } catch (error) {
      console.error("Error updating approval:", error);
      alert("Failed to update approval status");
    } finally {
      setUpdating(null);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const pendingCount = students.filter(s => !s.approved).length;
  const approvedCount = students.filter(s => s.approved).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Minimal Header */}
      <div className="mb-8 sm:mb-12">
        <h1 className="text-xl sm:text-2xl font-medium text-gray-900">Students</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage student accounts and approvals</p>
      </div>

      {/* Compact Stats Row */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-8 mb-6 sm:mb-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Total Students:</span>
          <span className="font-medium">{students.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Pending Approval:</span>
          <span className="font-medium">{pendingCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Approved:</span>
          <span className="font-medium">{approvedCount}</span>
        </div>
      </div>

      {/* Simple Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterApproved(null)}
            className={`px-3 py-2 text-sm font-medium rounded-md border transition ${
              filterApproved === null
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterApproved(false)}
            className={`px-3 py-2 text-sm font-medium rounded-md border transition ${
              filterApproved === false
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterApproved(true)}
            className={`px-3 py-2 text-sm font-medium rounded-md border transition ${
              filterApproved === true
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            Approved
          </button>
        </div>
      </div>

      {/* Simple Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <UnifiedLoading type="spinner" variant="pulse" size="md" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Student</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Branch</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Joined</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-medium text-xs flex-shrink-0">
                          {student.name?.charAt(0).toUpperCase() || student.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-medium text-gray-900">
                          {student.name || "No name"}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                      {student.email}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                      {student.branch?.name || "No branch"}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        student.approved
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        {student.approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm">
                      {student.approved ? (
                        <button
                          onClick={() => handleApprove(student.id, false)}
                          disabled={updating === student.id}
                          className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-50 rounded hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updating === student.id ? "Updating..." : "Revoke"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApprove(student.id, true)}
                          disabled={updating === student.id}
                          className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updating === student.id ? "Updating..." : "Approve"}
                        </button>
                      )}
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
