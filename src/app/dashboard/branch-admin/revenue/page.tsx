"use client";

import { useEffect, useState } from "react";

export default function BranchAdminRevenuePage() {
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const loadRevenueData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/branch-admin/revenue?year=${selectedYear}&month=${selectedMonth}`);
      const data = await res.json();
      setRevenueData(data);
    } catch (error) {
      console.error("Failed to load revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenueData();
  }, [selectedYear, selectedMonth]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID": return "text-green-600";
      case "PENDING": return "text-yellow-600";
      case "OVERDUE": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Revenue Analytics</h1>
        <p className="text-gray-600">Track income and expenses for your branch</p>
      </div>

      {/* Period Selector */}
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
        <button
          onClick={loadRevenueData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading revenue data...</p>
          </div>
        </div>
      ) : revenueData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(revenueData.summary.totalRevenue)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Paid Revenue</h3>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(revenueData.summary.paidRevenue)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Revenue</h3>
              <p className="text-3xl font-bold text-yellow-600">{formatCurrency(revenueData.summary.pendingRevenue)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Overdue Revenue</h3>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(revenueData.summary.overdueRevenue)}</p>
            </div>
          </div>

          {/* Revenue by Course Type */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue by Course Type</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(revenueData.revenueByCourse).map(([courseType, data]: [string, any]) => (
                      <tr key={courseType}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {courseType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(data.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {formatCurrency(data.paid)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                          {formatCurrency(data.pending)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {formatCurrency(data.overdue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Revenue by Student */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue by Student</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {revenueData.revenueByStudent.map((student: any) => (
                      <tr key={student.student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {student.student.name?.charAt(0)?.toUpperCase() || "?"}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{student.student.name || "—"}</div>
                              <div className="text-sm text-gray-500">{student.student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(student.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {formatCurrency(student.paid)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                          {formatCurrency(student.pending)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {formatCurrency(student.overdue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {revenueData.payments.map((payment: any) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{payment.student.name || "—"}</div>
                          <div className="text-sm text-gray-500">{payment.student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{payment.enrollment.courseName}</div>
                          <div className="text-sm text-gray-500">{payment.enrollment.courseType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payment.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                            payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            payment.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No revenue data found</h3>
          <p className="text-gray-500">No payments found for the selected period</p>
        </div>
      )}
    </div>
  );
}
