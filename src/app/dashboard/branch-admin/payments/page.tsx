"use client";

import { useEffect, useState } from "react";

export default function BranchAdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const [updateData, setUpdateData] = useState({
    status: "PAID",
    paymentMethod: "",
    notes: "",
  });

  const loadPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      
      const res = await fetch(`/api/branch-admin/payments?${params}`);
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (error) {
      console.error("Failed to load payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePayment = async () => {
    if (!selectedPayment) return;
    
    try {
      const res = await fetch("/api/branch-admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          ...updateData,
        }),
      });
      
      if (res.ok) {
        setShowUpdateModal(false);
        setSelectedPayment(null);
        setUpdateData({ status: "PAID", paymentMethod: "", notes: "" });
        await loadPayments();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update payment");
      }
    } catch (error) {
      console.error("Failed to update payment:", error);
      alert("Failed to update payment");
    }
  };

  const openUpdateModal = (payment: any) => {
    setSelectedPayment(payment);
    setUpdateData({
      status: payment.status,
      paymentMethod: payment.paymentMethod || "",
      notes: payment.notes || "",
    });
    setShowUpdateModal(true);
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.enrollment?.courseName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
        <p className="text-gray-600">Track and manage student payments and schedules</p>
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
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading payments...</p>
          </div>
        </div>
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
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
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
                          <div className="text-sm font-medium text-gray-900">
                            {payment.student?.name || "—"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.student?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.enrollment?.courseName || "—"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.enrollment?.courseType} {payment.enrollment?.level}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${payment.amount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(payment.dueDate).toLocaleDateString()}
                      </div>
                      {payment.paidDate && (
                        <div className="text-sm text-green-600">
                          Paid: {new Date(payment.paidDate).toLocaleDateString()}
                        </div>
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
                          onClick={() => openUpdateModal(payment)}
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
          
          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter ? "Try adjusting your search filters" : "No payment schedules have been created yet"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Update Payment Modal */}
      {showUpdateModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Update Payment</h3>
            
            <div className="mb-4 text-sm">
              <div><span className="text-gray-500">Student:</span> {selectedPayment.student?.name}</div>
              <div><span className="text-gray-500">Course:</span> {selectedPayment.enrollment?.courseName}</div>
              <div><span className="text-gray-500">Amount:</span> ${selectedPayment.amount}</div>
              <div><span className="text-gray-500">Due Date:</span> {new Date(selectedPayment.dueDate).toLocaleDateString()}</div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={updateData.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="PAID">Paid</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {updateData.status === "PAID" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={updateData.paymentMethod}
                    onChange={(e) => setUpdateData({ ...updateData, paymentMethod: e.target.value })}
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
                  value={updateData.notes}
                  onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updatePayment}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Update Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
