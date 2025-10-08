"use client";

import { useEffect, useState } from "react";

export default function BossFinancePage() {
  const [financeData, setFinanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
      });
      const res = await fetch(`/api/analytics/boss/finance?${params}`);
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
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' AZN';
  };

  const formatPercent = (pct: number) => {
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
  };

  const getPercentColor = (pct: number) => {
    if (pct > 0) return 'text-green-600';
    if (pct < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const seedDemoData = async (months: number) => {
    if (!confirm(`Generate ${months} months of demo finance data?`)) return;
    
    try {
      const res = await fetch(`/api/admin/finance/seed?months=${months}`, {
        method: 'POST',
      });
      const data = await res.json();
      alert(`Success! Created ${data.summary?.transactionsCreated || 0} transactions.`);
      loadFinanceData();
    } catch (error) {
      console.error("Failed to seed data:", error);
      alert("Failed to seed demo data");
    }
  };

  const clearDemoData = async () => {
    if (!confirm("Clear all demo finance data? This will only delete seeded transactions, not actual data.")) return;
    
    try {
      const res = await fetch(`/api/admin/finance/clear`, {
        method: 'DELETE',
      });
      const data = await res.json();
      alert(`Success! Deleted ${data.deletedCount || 0} demo transactions.`);
      loadFinanceData();
    } catch (error) {
      console.error("Failed to clear demo data:", error);
      alert("Failed to clear demo data");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finance Analytics</h1>
          <p className="text-gray-600">Multi-branch income, expenses, and net revenue tracking</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => seedDemoData(6)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Seed Demo Data (6 months)
          </button>
          <button
            onClick={clearDemoData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Clear Demo Data
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="border rounded px-3 py-2"
            />
          </div>
          <button
            onClick={loadFinanceData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading finance data...</p>
          </div>
        </div>
      ) : financeData ? (
        <div className="space-y-6">
          {/* This Month vs Last Month Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Net Revenue (This vs Last Month)</h3>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(financeData.thisMonthVsLast.thisMonth.net)}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-sm font-semibold ${getPercentColor(financeData.thisMonthVsLast.netPct)}`}>
                  {formatPercent(financeData.thisMonthVsLast.netPct)}
                </span>
                <span className="text-sm text-gray-500">
                  ({formatCurrency(financeData.thisMonthVsLast.netDelta)})
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last month: {formatCurrency(financeData.thisMonthVsLast.lastMonth.net)}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Income (This vs Last Month)</h3>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(financeData.thisMonthVsLast.thisMonth.income)}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-sm font-semibold ${getPercentColor(financeData.thisMonthVsLast.revenuePct)}`}>
                  {formatPercent(financeData.thisMonthVsLast.revenuePct)}
                </span>
                <span className="text-sm text-gray-500">
                  ({formatCurrency(financeData.thisMonthVsLast.revenueDelta)})
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last month: {formatCurrency(financeData.thisMonthVsLast.lastMonth.income)}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Expenses (This vs Last Month)</h3>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(financeData.thisMonthVsLast.thisMonth.expense)}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-sm font-semibold ${getPercentColor(-financeData.thisMonthVsLast.expensePct)}`}>
                  {formatPercent(financeData.thisMonthVsLast.expensePct)}
                </span>
                <span className="text-sm text-gray-500">
                  ({formatCurrency(financeData.thisMonthVsLast.expenseDelta)})
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last month: {formatCurrency(financeData.thisMonthVsLast.lastMonth.expense)}
              </p>
            </div>
          </div>

          {/* Overall Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Income (Period)</h3>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(financeData.summary.totalIncome)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Expenses (Period)</h3>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(financeData.summary.totalExpense)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Net (Period)</h3>
              <p className={`text-3xl font-bold ${financeData.summary.totalNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(financeData.summary.totalNet)}
              </p>
            </div>
          </div>

          {/* Branch Comparison Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Branch Net Comparison</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visual</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {financeData.byBranch.map((branch: any) => (
                      <tr key={branch.branchId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {branch.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {formatCurrency(branch.income)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {formatCurrency(branch.expense)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${branch.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {formatCurrency(branch.net)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${branch.net >= 0 ? 'bg-blue-600' : 'bg-red-600'}`}
                              style={{ 
                                width: `${Math.min(100, Math.abs(branch.net) / Math.max(...financeData.byBranch.map((b: any) => Math.abs(b.net))) * 100)}%` 
                              }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Monthly Trend Chart (Simple bars) */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Trend</h3>
              <div className="space-y-4">
                {financeData.byMonth.map((month: any) => {
                  const maxAmount = Math.max(
                    ...financeData.byMonth.map((m: any) => Math.max(m.income, m.expense))
                  );
                  return (
                    <div key={month.monthISO} className="border-b pb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {new Date(month.monthISO + '-01').toLocaleDateString('default', { year: 'numeric', month: 'long' })}
                        </span>
                        <span className={`text-sm font-semibold ${month.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          Net: {formatCurrency(month.net)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Income</span>
                            <span>{formatCurrency(month.income)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-green-600 h-3 rounded-full"
                              style={{ width: `${(month.income / maxAmount) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Expenses</span>
                            <span>{formatCurrency(month.expense)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-red-600 h-3 rounded-full"
                              style={{ width: `${(month.expense / maxAmount) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No finance data found</h3>
          <p className="text-gray-500 mb-4">No transactions found for the selected period</p>
          <div className="flex gap-3">
            <button
              onClick={() => seedDemoData(6)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Generate Demo Data
            </button>
            <button
              onClick={clearDemoData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Clear Demo Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
