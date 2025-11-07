"use client";

import { useEffect, useState } from "react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

export default function BranchAdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [newEnrollment, setNewEnrollment] = useState({
    studentId: "",
    courseName: "",
    courseType: "GENERAL_ENGLISH",
    level: "",
    notes: "",
    monthlyAmount: 0,
    startDate: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [enrollmentsRes, studentsRes] = await Promise.all([
        fetch("/api/branch-admin/enrollments"),
        fetch("/api/branch-admin/students"),
      ]);
      const enrollmentsData = await enrollmentsRes.json();
      const studentsData = await studentsRes.json();
      setEnrollments(enrollmentsData.enrollments || []);
      setStudents(studentsData.students || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createEnrollment = async () => {
    try {
      const res = await fetch("/api/branch-admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEnrollment),
      });
      
      if (res.ok) {
        setShowCreateModal(false);
        setNewEnrollment({
          studentId: "",
          courseName: "",
          courseType: "GENERAL_ENGLISH",
          level: "",
          notes: "",
          monthlyAmount: 0,
          startDate: "",
        });
        await loadData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create enrollment");
      }
    } catch (error) {
      console.error("Failed to create enrollment:", error);
      alert("Failed to create enrollment");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = 
      enrollment.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.courseName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || enrollment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Enrollments</h1>
            <p className="text-gray-600">Manage student course enrollments and payment schedules</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + New Enrollment
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by student name, email, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <UnifiedLoading type="spinner" variant="spinner" size="md" text="Loading enrollments..." />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrolled
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {enrollment.student?.name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {enrollment.student?.name || "—"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {enrollment.student?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {enrollment.courseName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {enrollment.courseType}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {enrollment.level || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        enrollment.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        enrollment.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                        enrollment.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {enrollment.paymentSchedules?.[0] ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(enrollment.paymentSchedules[0].dueDate).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            ${enrollment.paymentSchedules[0].amount}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No payments</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredEnrollments.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No enrollments found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter ? "Try adjusting your search filters" : "No students have been enrolled yet"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create Enrollment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Enrollment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select
                  value={newEnrollment.studentId}
                  onChange={(e) => setNewEnrollment({ ...newEnrollment, studentId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                <input
                  type="text"
                  value={newEnrollment.courseName}
                  onChange={(e) => setNewEnrollment({ ...newEnrollment, courseName: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., IELTS Preparation"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Type</label>
                  <select
                    value={newEnrollment.courseType}
                    onChange={(e) => setNewEnrollment({ ...newEnrollment, courseType: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="IELTS">IELTS</option>
                    <option value="GENERAL_ENGLISH">General English</option>
                    <option value="TOEFL">TOEFL</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <input
                    type="text"
                    value={newEnrollment.level}
                    onChange={(e) => setNewEnrollment({ ...newEnrollment, level: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., A1, B1, B2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Amount</label>
                <input
                  type="number"
                  value={newEnrollment.monthlyAmount}
                  onChange={(e) => setNewEnrollment({ ...newEnrollment, monthlyAmount: Number(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (optional)</label>
                <input
                  type="date"
                  value={newEnrollment.startDate}
                  onChange={(e) => setNewEnrollment({ ...newEnrollment, startDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={newEnrollment.notes}
                  onChange={(e) => setNewEnrollment({ ...newEnrollment, notes: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createEnrollment}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Create Enrollment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
