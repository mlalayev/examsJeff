"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Users, Building2, Calendar, Search } from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

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
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <UnifiedLoading type="spinner" variant="spinner" size="md" />
        </div>
      </div>
    );
  }

  if (!financeData) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Minimal Header */}
      <div className="mb-12">
        <h1 className="text-2xl font-medium text-gray-900">Finance</h1>
        <p className="text-gray-500 mt-1">Financial overview and analytics</p>
      </div>

      {/* Compact Stats Row */}
      <div className="flex items-center gap-8 mb-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Total Income:</span>
          <span className="font-medium text-green-600">{formatCurrency(financeData.summary?.totalIncome || 0)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Total Expenses:</span>
          <span className="font-medium text-red-600">{formatCurrency(financeData.summary?.totalExpense || 0)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Net Profit:</span>
          <span className={`font-medium ${(financeData.summary?.totalNet || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(financeData.summary?.totalNet || 0)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Tuition Revenue:</span>
          <span className="font-medium">{formatCurrency(financeData.summary?.tuitionRevenue || 0)}</span>
        </div>
      </div>

      {/* Simple Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
            >
              {years.map((year) => (
              <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

            <select
              value={selectedMonth || ""}
              onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
          className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
            >
              {months.map((month) => (
            <option key={month.label} value={month.value || ""}>{month.label}</option>
              ))}
            </select>

            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
            >
              <option value="">All Branches</option>
              {financeData.branches?.map((branch: any) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setSelectedYear(currentYear);
                setSelectedMonth(null);
                setSelectedBranch("");
              }}
          className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50"
            >
          Reset
            </button>
      </div>

      {/* Simple Tabs */}
      <div className="flex items-center gap-1 mb-6">
            <button
              onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === "overview"
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
          Overview
            </button>
            <button
              onClick={() => setActiveTab("monthly")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === "monthly"
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
          Monthly
            </button>
            <button
              onClick={() => setActiveTab("branches")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === "branches"
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
          Branches
            </button>
            <button
              onClick={() => setActiveTab("courses")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === "courses"
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
          Courses
            </button>
        </div>

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="pb-6">
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
    <div className="p-6">
      {/* Current Month Payment Status */}
      {data.currentMonth && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Current Month Payment Status ({data.currentMonth.month}/{data.currentMonth.year})
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.currentMonth.paidCount}</div>
              <div className="text-sm text-gray-600">Paid</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{data.currentMonth.unpaidCount}</div>
              <div className="text-sm text-gray-600">Unpaid</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{data.currentMonth.noRecordCount}</div>
              <div className="text-sm text-gray-600">No Record</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{data.currentMonth.totalStudents}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Payment Rate: <span className="font-medium">{data.currentMonth.paymentRate}%</span></span>
            <span className="text-gray-600">Pending: <span className="font-medium">{data.currentMonth.unpaidCount + data.currentMonth.noRecordCount}</span></span>
          </div>
        </div>
      )}

      {/* Summary Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Metric</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-3 text-sm text-gray-900">Total Income</td>
              <td className="px-4 py-3 text-sm text-right font-medium text-green-600">{formatCurrency(data.summary?.totalIncome || 0)}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-900">Total Expenses</td>
              <td className="px-4 py-3 text-sm text-right font-medium text-red-600">{formatCurrency(data.summary?.totalExpense || 0)}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-900">Net Profit/Loss</td>
              <td className={`px-4 py-3 text-sm text-right font-medium ${(data.summary?.totalNet || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.summary?.totalNet || 0)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-900">Tuition Revenue</td>
              <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(data.summary?.tuitionRevenue || 0)}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-900">Payment Count</td>
              <td className="px-4 py-3 text-sm text-right font-medium">{data.summary?.tuitionPaymentCount || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Monthly Tab Component
function MonthlyTab({ data, formatCurrency }: any) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Breakdown for {data.period?.year || new Date().getFullYear()}</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Month</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Income</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Expenses</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Net</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Tuition</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.monthlyBreakdown?.map((month: any) => (
              <tr key={month.month} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{month.monthName}</td>
                <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(month.income)}</td>
                <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(month.expense)}</td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${month.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(month.net)}
                </td>
                <td className="px-4 py-3 text-sm text-right">{formatCurrency(month.tuitionRevenue)}</td>
              </tr>
            )) || []}
          </tbody>
          <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
              <td className="px-4 py-3 text-sm font-medium">TOTAL</td>
              <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                {formatCurrency(data.monthlyBreakdown?.reduce((sum: number, m: any) => sum + m.income, 0) || 0)}
              </td>
              <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                {formatCurrency(data.monthlyBreakdown?.reduce((sum: number, m: any) => sum + m.expense, 0) || 0)}
              </td>
              <td className="px-4 py-3 text-sm text-right font-medium">
                {formatCurrency(data.monthlyBreakdown?.reduce((sum: number, m: any) => sum + m.net, 0) || 0)}
              </td>
              <td className="px-4 py-3 text-sm text-right font-medium">
                {formatCurrency(data.monthlyBreakdown?.reduce((sum: number, m: any) => sum + m.tuitionRevenue, 0) || 0)}
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
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Branch Performance</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Branch</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Students</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Income</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Expenses</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Net</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Tuition</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.branchBreakdown?.map((branch: any) => (
              <tr key={branch.branchId} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{branch.branchName}</td>
                <td className="px-4 py-3 text-sm text-right">{branch.studentCount}</td>
                <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(branch.income)}</td>
                <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(branch.expense)}</td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${branch.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(branch.net)}
                </td>
                <td className="px-4 py-3 text-sm text-right">{formatCurrency(branch.tuitionRevenue)}</td>
              </tr>
            )) || []}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Courses Tab Component
function CoursesTab({ data, formatCurrency }: any) {
  const courseLabels: Record<string, string> = {
    IELTS: "IELTS Preparation",
    SAT: "SAT Preparation",
    KIDS: "Kids English",
    GENERAL_ENGLISH: "General English",
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Course Type Statistics</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Course Type</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Students</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Revenue</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Avg/Student</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.courseTypeStats?.map((course: any) => (
              <tr key={course.courseType} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {courseLabels[course.courseType] || course.courseType}
                </td>
                <td className="px-4 py-3 text-sm text-right">{course.studentCount}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(course.revenue)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {course.studentCount > 0 ? formatCurrency(course.revenue / course.studentCount) : "—"}
                </td>
              </tr>
            )) || []}
          </tbody>
          <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
              <td className="px-4 py-3 text-sm font-medium">TOTAL</td>
              <td className="px-4 py-3 text-sm text-right font-medium">
                {data.courseTypeStats?.reduce((sum: number, c: any) => sum + c.studentCount, 0) || 0}
              </td>
              <td className="px-4 py-3 text-sm text-right font-medium">
                {formatCurrency(data.courseTypeStats?.reduce((sum: number, c: any) => sum + c.revenue, 0) || 0)}
              </td>
              <td className="px-4 py-3 text-sm text-right font-medium">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

