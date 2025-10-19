"use client";

import { useEffect, useState } from "react";
import Loading from "@/components/loading/Loading";

type TabType = "overview" | "monthly" | "branches" | "courses";

export default function BossFinanceV2Page() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [financeData, setFinanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        year: selectedYear.toString(),
      });
      
      if (selectedMonth) {
        params.append("month", selectedMonth.toString());
      }
      
      if (selectedBranch) {
        params.append("branchId", selectedBranch);
      }

      const res = await fetch(`/api/analytics/boss/finance-enhanced?${params}`);
      const data = await res.json();
      setFinanceData(data);
    } catch (error) {
      console.error("Failed to load finance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, [selectedYear, selectedMonth, selectedBranch]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' AZN';
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: null, label: "All Year" },
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loading size="lg" variant="spinner" />
        </div>
      </div>
    );
  }

  if (!financeData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          💰 Finance Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          Comprehensive financial overview and insights
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {years.map((year) => (
                <key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              value={selectedMonth || ""}
              onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {months.map((month) => (
                <option key={month.label} value={month.value || ""}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Branches</option>
              {financeData.branches?.map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedYear(currentYear);
                setSelectedMonth(null);
                setSelectedBranch("");
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === "overview"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab("monthly")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === "monthly"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📅 Monthly Breakdown
            </button>
            <button
              onClick={() => setActiveTab("branches")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === "branches"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🏢 By Branch
            </button>
            <button
              onClick={() => setActiveTab("courses")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === "courses"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📚 By Course Type
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "overview" && <OverviewTab data={financeData} formatCurrency={formatCurrency} />}
          {activeTab === "monthly" && <MonthlyTab data={financeData} formatCurrency={formatCurrency} />}
          {activeTab === "branches" && <BranchesTab data={financeData} formatCurrency={formatCurrency} />}
          {activeTab === "courses" && <CoursesTab data={financeData} formatCurrency={formatCurrency} />}
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ data, formatCurrency }: any) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <div className="text-sm font-medium text-green-700 mb-1">Total Income</div>
          <div className="text-2xl font-bold text-green-900">{formatCurrency(data.summary.totalIncome)}</div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
          <div className="text-sm font-medium text-red-700 mb-1">Total Expenses</div>
          <div className="text-2xl font-bold text-red-900">{formatCurrency(data.summary.totalExpense)}</div>
        </div>

        <div className={`bg-gradient-to-br ${data.summary.totalNet >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'} border rounded-lg p-4`}>
          <div className={`text-sm font-medium ${data.summary.totalNet >= 0 ? 'text-blue-700' : 'text-orange-700'} mb-1`}>
            Net Profit/Loss
          </div>
          <div className={`text-2xl font-bold ${data.summary.totalNet >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
            {formatCurrency(data.summary.totalNet)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
          <div className="text-sm font-medium text-purple-700 mb-1">Tuition Revenue</div>
          <div className="text-2xl font-bold text-purple-900">{formatCurrency(data.summary.tuitionRevenue)}</div>
          <div className="text-xs text-purple-600 mt-1">
            {data.summary.tuitionPaymentCount} payments
          </div>
        </div>
      </div>

      {/* Tuition Payment Status */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Payment Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Paid</div>
            <div className="text-xl font-bold text-green-600">{data.summary.tuitionPaymentCount}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Unpaid</div>
            <div className="text-xl font-bold text-red-600">{data.summary.tuitionUnpaidCount}</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Collection Rate</span>
            <span className="text-lg font-bold text-blue-600">
              {data.summary.tuitionPaymentCount + data.summary.tuitionUnpaidCount > 0
                ? ((data.summary.tuitionPaymentCount / (data.summary.tuitionPaymentCount + data.summary.tuitionUnpaidCount)) * 100).toFixed(1)
                : "0.0"}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Monthly Tab Component
function MonthlyTab({ data, formatCurrency }: any) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Monthly Breakdown for {data.period.year}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expenses</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tuition</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.monthlyBreakdown.map((month: any) => (
              <tr key={month.month} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{month.monthName}</td>
                <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(month.income)}</td>
                <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(month.expense)}</td>
                <td className={`px-4 py-3 text-sm text-right font-semibold ${month.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(month.net)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-purple-600">{formatCurrency(month.tuitionRevenue)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 font-semibold">
            <tr>
              <td className="px-4 py-3 text-sm">TOTAL</td>
              <td className="px-4 py-3 text-sm text-right text-green-700">
                {formatCurrency(data.monthlyBreakdown.reduce((sum: number, m: any) => sum + m.income, 0))}
              </td>
              <td className="px-4 py-3 text-sm text-right text-red-700">
                {formatCurrency(data.monthlyBreakdown.reduce((sum: number, m: any) => sum + m.expense, 0))}
              </td>
              <td className="px-4 py-3 text-sm text-right text-blue-700">
                {formatCurrency(data.monthlyBreakdown.reduce((sum: number, m: any) => sum + m.net, 0))}
              </td>
              <td className="px-4 py-3 text-sm text-right text-purple-700">
                {formatCurrency(data.monthlyBreakdown.reduce((sum: number, m: any) => sum + m.tuitionRevenue, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// Branches Tab Component
function BranchesTab({ data, formatCurrency }: any) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Branch Performance</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {data.branchBreakdown.map((branch: any) => (
          <div key={branch.branchId} className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">{branch.branchName}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Students:</span>
                <span className="font-semibold">{branch.studentCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Income:</span>
                <span className="font-semibold text-green-600">{formatCurrency(branch.income)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expenses:</span>
                <span className="font-semibold text-red-600">{formatCurrency(branch.expense)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-600">Net:</span>
                <span className={`font-bold ${branch.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(branch.net)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tuition:</span>
                <span className="font-semibold text-purple-600">{formatCurrency(branch.tuitionRevenue)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Courses Tab Component
function CoursesTab({ data, formatCurrency }: any) {
  const courseIcons: Record<string, string> = {
    IELTS: "🎓",
    SAT: "📝",
    KIDS: "👶",
    GENERAL_ENGLISH: "🌐",
  };

  const courseLabels: Record<string, string> = {
    IELTS: "IELTS Preparation",
    SAT: "SAT Preparation",
    KIDS: "Kids English",
    GENERAL_ENGLISH: "General English",
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Course Type Statistics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.courseTypeStats.map((course: any) => (
          <div key={course.courseType} className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-4">
            <div className="text-2xl mb-2">{courseIcons[course.courseType] || "📚"}</div>
            <h4 className="font-semibold text-gray-900 mb-3">{courseLabels[course.courseType] || course.courseType}</h4>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-600">Active Students</div>
                <div className="text-2xl font-bold text-indigo-900">{course.studentCount}</div>
              </div>
              <div className="pt-2 border-t border-indigo-200">
                <div className="text-xs text-gray-600">Revenue</div>
                <div className="text-lg font-bold text-indigo-700">{formatCurrency(course.revenue)}</div>
              </div>
              {course.studentCount > 0 && (
                <div className="text-xs text-gray-500">
                  Avg: {formatCurrency(course.revenue / course.studentCount)}/student
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 bg-white border rounded-lg p-4">
        <h4 className="font-semibold mb-3">Total Summary</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Total Students</div>
            <div className="text-2xl font-bold text-gray-900">
              {data.courseTypeStats.reduce((sum: number, c: any) => sum + c.studentCount, 0)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Revenue</div>
            <div className="text-2xl font-bold text-indigo-600">
              {formatCurrency(data.courseTypeStats.reduce((sum: number, c: any) => sum + c.revenue, 0))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

