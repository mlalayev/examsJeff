"use client";

import { useEffect, useState } from "react";

export default function BranchAdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("students");
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showStudentPaymentModal, setShowStudentPaymentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedStudentPayments, setSelectedStudentPayments] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const [newEnrollment, setNewEnrollment] = useState({
    studentId: "",
    courseName: "",
    courseType: "GENERAL_ENGLISH",
    level: "",
    notes: "",
    monthlyAmount: 0,
    startDate: "",
  });

  const [newPayment, setNewPayment] = useState({
    enrollmentId: "",
    amount: 0,
    dueDate: "",
    notes: "",
  });

  const [updatePayment, setUpdatePayment] = useState({
    paymentId: "",
    status: "PAID",
    paymentMethod: "",
    notes: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, enrollmentsRes, paymentsRes] = await Promise.all([
        fetch("/api/branch-admin/students"),
        fetch("/api/branch-admin/enrollments"),
        fetch("/api/branch-admin/payments"),
      ]);
      
      const studentsData = await studentsRes.json();
      const enrollmentsData = await enrollmentsRes.json();
      const paymentsData = await paymentsRes.json();
      
      setStudents(studentsData.students || []);
      setEnrollments(enrollmentsData.enrollments || []);
      setPayments(paymentsData.payments || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveStudent = async (studentId: string) => {
    try {
      await fetch(`/api/admin/users/${studentId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });
      await loadData();
    } catch (error) {
      console.error("Failed to approve student:", error);
    }
  };

  const createEnrollment = async () => {
    // Validate required fields
    if (!newEnrollment.courseName.trim()) {
      alert("Course name is required");
      return;
    }
    if (newEnrollment.monthlyAmount <= 0) {
      alert("Monthly amount must be greater than 0");
      return;
    }

    try {
      // Prepare data for API
      const enrollmentData = {
        studentId: newEnrollment.studentId,
        courseName: newEnrollment.courseName.trim(),
        courseType: newEnrollment.courseType,
        level: newEnrollment.level || undefined,
        notes: newEnrollment.notes || undefined,
        monthlyAmount: newEnrollment.monthlyAmount,
        startDate: newEnrollment.startDate ? new Date(newEnrollment.startDate).toISOString() : undefined,
      };

      const res = await fetch("/api/branch-admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enrollmentData),
      });
      
      if (res.ok) {
        setShowEnrollmentModal(false);
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
        console.error("Enrollment error:", error);
        if (error.details && Array.isArray(error.details)) {
          const errorMessages = error.details.map((err: any) => `${err.path.join('.')}: ${err.message}`).join('\n');
          alert(`Validation errors:\n${errorMessages}`);
        } else {
          alert(error.error || "Failed to create enrollment");
        }
      }
    } catch (error) {
      console.error("Failed to create enrollment:", error);
      alert("Failed to create enrollment");
    }
  };

  const createPayment = async () => {
    try {
      const res = await fetch("/api/branch-admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPayment),
      });
      
      if (res.ok) {
        setShowPaymentModal(false);
        setNewPayment({
          enrollmentId: "",
          amount: 0,
          dueDate: "",
          notes: "",
        });
        await loadData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create payment");
      }
    } catch (error) {
      console.error("Failed to create payment:", error);
      alert("Failed to create payment");
    }
  };

  const updatePaymentStatus = async () => {
    try {
      const res = await fetch("/api/branch-admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayment),
      });
      
      if (res.ok) {
        setShowPaymentModal(false);
        setUpdatePayment({ paymentId: "", status: "PAID", paymentMethod: "", notes: "" });
        await loadData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update payment");
      }
    } catch (error) {
      console.error("Failed to update payment:", error);
      alert("Failed to update payment");
    }
  };

  const openEnrollmentModal = (student: any) => {
    setSelectedStudent(student);
    setNewEnrollment({ ...newEnrollment, studentId: student.id });
    setShowEnrollmentModal(true);
  };

  const openPaymentModal = (payment: any) => {
    setUpdatePayment({
      paymentId: payment.id,
      status: payment.status,
      paymentMethod: payment.paymentMethod || "",
      notes: payment.notes || "",
    });
    setShowPaymentModal(true);
  };

  const openStudentPaymentModal = async (student: any) => {
    setSelectedStudent(student);
    try {
      const res = await fetch(`/api/branch-admin/student-payments?studentId=${student.id}`);
      const data = await res.json();
      setSelectedStudentPayments(data.payments || []);
      setShowStudentPaymentModal(true);
    } catch (error) {
      console.error("Failed to load student payments:", error);
      alert("Failed to load student payments");
    }
  };

  const markPaymentAsPaid = async (paymentId: string, year: number, month: number) => {
    try {
      const res = await fetch("/api/branch-admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: paymentId,
          status: "PAID",
          paymentMethod: "CASH", // Default method
          notes: `Paid for ${year}-${month.toString().padStart(2, '0')}`,
        }),
      });
      
      if (res.ok) {
        await loadData(); // Reload all data
        // Reload student payments
        const studentRes = await fetch(`/api/branch-admin/student-payments?studentId=${selectedStudent.id}`);
        const studentData = await studentRes.json();
        setSelectedStudentPayments(studentData.payments || []);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to mark payment as paid");
      }
    } catch (error) {
      console.error("Failed to mark payment as paid:", error);
      alert("Failed to mark payment as paid");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEnrollments = enrollments.filter(enrollment =>
    enrollment.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.courseName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayments = payments.filter(payment =>
    payment.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.enrollment?.courseName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID": return "bg-green-100 text-green-800";
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "OVERDUE": return "bg-red-100 text-red-800";
      case "CANCELLED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Management</h1>
        <p className="text-gray-600">Comprehensive student, enrollment, and payment management</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("students")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "students"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Students ({students.length})
            </button>
            <button
              onClick={() => setActiveTab("enrollments")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "enrollments"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Enrollments ({enrollments.length})
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "payments"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Payments ({payments.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, email, or course..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Students Tab */}
          {activeTab === "students" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => student.approved && openStudentPaymentModal(student)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {student.name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name || "—"}</div>
                          {student.approved && (
                            <div className="text-xs text-gray-500">Click to manage payments</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.approved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {student.approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {!student.approved && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              approveStudent(student.id);
                            }}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {student.approved && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEnrollmentModal(student);
                            }}
                            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors"
                          >
                            Enroll
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Enrollments Tab */}
          {activeTab === "enrollments" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled</th>
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
                              <div className="text-sm font-medium text-gray-900">{enrollment.student?.name || "—"}</div>
                              <div className="text-sm text-gray-500">{enrollment.student?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{enrollment.courseName}</div>
                          <div className="text-sm text-gray-500">{enrollment.courseType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{enrollment.level || "—"}</span>
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
                              <div className="text-sm text-gray-500">${enrollment.paymentSchedules[0].amount}</div>
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
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {payment.student?.name?.charAt(0)?.toUpperCase() || "?"}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{payment.student?.name || "—"}</div>
                              <div className="text-sm text-gray-500">{payment.student?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{payment.enrollment?.courseName || "—"}</div>
                          <div className="text-sm text-gray-500">{payment.enrollment?.courseType} {payment.enrollment?.level}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">${payment.amount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{new Date(payment.dueDate).toLocaleDateString()}</div>
                          {payment.paidDate && (
                            <div className="text-sm text-green-600">Paid: {new Date(payment.paidDate).toLocaleDateString()}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {payment.status === "PENDING" && (
                            <button
                              onClick={() => openPaymentModal(payment)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}
                          {payment.status === "PAID" && (
                            <span className="text-green-600 text-sm">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Enrollment Modal */}
      {showEnrollmentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Enroll Student in Course</h3>
            
            <div className="mb-4 text-sm">
              <div><span className="text-gray-500">Student:</span> {selectedStudent.name}</div>
              <div><span className="text-gray-500">Email:</span> {selectedStudent.email}</div>
            </div>
            
            <div className="space-y-4">
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
                onClick={() => setShowEnrollmentModal(false)}
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

      {/* Update Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Update Payment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={updatePayment.status}
                  onChange={(e) => setUpdatePayment({ ...updatePayment, status: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="PAID">Paid</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {updatePayment.status === "PAID" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={updatePayment.paymentMethod}
                    onChange={(e) => setUpdatePayment({ ...updatePayment, paymentMethod: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select method</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={updatePayment.notes}
                  onChange={(e) => setUpdatePayment({ ...updatePayment, notes: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updatePaymentStatus}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Update Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Payment Modal */}
      {showStudentPaymentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Payment Management - {selectedStudent.name}</h3>
              <button
                onClick={() => setShowStudentPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Year and Month Selector */}
            <div className="mb-6 flex gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border rounded px-3 py-2"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="border rounded px-3 py-2"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>
                      {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Calendar */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1).map(day => {
                const currentDate = new Date(selectedYear, selectedMonth - 1, day);
                const dayOfWeek = currentDate.getDay();
                const isToday = currentDate.toDateString() === new Date().toDateString();
                
                // Find payment for this day
                const dayPayment = selectedStudentPayments.find(payment => {
                  const paymentDate = new Date(payment.dueDate);
                  return paymentDate.getDate() === day && 
                         paymentDate.getMonth() === selectedMonth - 1 && 
                         paymentDate.getFullYear() === selectedYear;
                });

                return (
                  <div
                    key={day}
                    className={`p-2 text-center text-sm border rounded cursor-pointer transition-colors ${
                      dayOfWeek === 0 || dayOfWeek === 6 
                        ? 'bg-gray-50 text-gray-400' 
                        : 'hover:bg-gray-50'
                    } ${
                      isToday ? 'bg-blue-100 border-blue-300' : ''
                    } ${
                      dayPayment 
                        ? dayPayment.status === 'PAID' 
                          ? 'bg-green-100 border-green-300 text-green-800' 
                          : dayPayment.status === 'OVERDUE'
                          ? 'bg-red-100 border-red-300 text-red-800'
                          : 'bg-yellow-100 border-yellow-300 text-yellow-800'
                        : ''
                    }`}
                    onClick={() => {
                      if (dayPayment && dayPayment.status !== 'PAID') {
                        markPaymentAsPaid(dayPayment.id, selectedYear, selectedMonth);
                      }
                    }}
                  >
                    <div className="font-medium">{day}</div>
                    {dayPayment && (
                      <div className="text-xs mt-1">
                        <div className="font-medium">${dayPayment.amount}</div>
                        <div className={`text-xs ${
                          dayPayment.status === 'PAID' ? 'text-green-600' :
                          dayPayment.status === 'OVERDUE' ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          {dayPayment.status}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Payment Summary for {selectedYear}-{selectedMonth.toString().padStart(2, '0')}</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Total Payments</div>
                  <div className="font-semibold">
                    ${selectedStudentPayments
                      .filter(p => {
                        const paymentDate = new Date(p.dueDate);
                        return paymentDate.getMonth() === selectedMonth - 1 && 
                               paymentDate.getFullYear() === selectedYear;
                      })
                      .reduce((sum, p) => sum + Number(p.amount), 0)
                      .toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Paid</div>
                  <div className="font-semibold text-green-600">
                    ${selectedStudentPayments
                      .filter(p => {
                        const paymentDate = new Date(p.dueDate);
                        return paymentDate.getMonth() === selectedMonth - 1 && 
                               paymentDate.getFullYear() === selectedYear &&
                               p.status === 'PAID';
                      })
                      .reduce((sum, p) => sum + Number(p.amount), 0)
                      .toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Pending</div>
                  <div className="font-semibold text-yellow-600">
                    ${selectedStudentPayments
                      .filter(p => {
                        const paymentDate = new Date(p.dueDate);
                        return paymentDate.getMonth() === selectedMonth - 1 && 
                               paymentDate.getFullYear() === selectedYear &&
                               p.status === 'PENDING';
                      })
                      .reduce((sum, p) => sum + Number(p.amount), 0)
                      .toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowStudentPaymentModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}