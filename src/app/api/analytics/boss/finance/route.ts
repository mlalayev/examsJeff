import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/analytics/boss/finance?from=&to=&groupBy=month
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const role = (user as any).role;
    
    if (role !== "BOSS") {
      return NextResponse.json({ error: "Forbidden: Boss access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    // Default to last 12 months if no dates provided
    const defaultTo = new Date();
    const defaultFrom = new Date();
    defaultFrom.setMonth(defaultFrom.getMonth() - 12);
    
    const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : defaultFrom;
    const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : defaultTo;

    // Get all transactions in the date range
    const transactions = await prisma.financeTxn.findMany({
      where: {
        occurredAt: {
          gte: from,
          lte: to,
        },
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { occurredAt: "asc" },
    });

    // Get all branches for complete reporting
    const branches = await prisma.branch.findMany({
      select: { id: true, name: true },
    });

    // Calculate by branch
    const byBranch = branches.map(branch => {
      const branchTxns = transactions.filter(t => t.branchId === branch.id);
      const income = branchTxns
        .filter(t => t.kind === "INCOME")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = branchTxns
        .filter(t => t.kind === "EXPENSE")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      return {
        branchId: branch.id,
        name: branch.name,
        income,
        expense,
        net: income - expense,
      };
    });

    // Calculate by month
    const monthlyMap = new Map<string, { income: number; expense: number }>();
    
    transactions.forEach(txn => {
      const monthISO = txn.occurredAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyMap.has(monthISO)) {
        monthlyMap.set(monthISO, { income: 0, expense: 0 });
      }
      const month = monthlyMap.get(monthISO)!;
      
      if (txn.kind === "INCOME") {
        month.income += Number(txn.amount);
      } else if (txn.kind === "EXPENSE") {
        month.expense += Number(txn.amount);
      }
    });

    const byMonth = Array.from(monthlyMap.entries())
      .map(([monthISO, data]) => ({
        monthISO,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
      }))
      .sort((a, b) => a.monthISO.localeCompare(b.monthISO));

    // Calculate this month vs last month
    const now = new Date();
    const thisMonthISO = now.toISOString().substring(0, 7);
    const lastMonthDate = new Date(now);
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastMonthISO = lastMonthDate.toISOString().substring(0, 7);

    const thisMonth = byMonth.find(m => m.monthISO === thisMonthISO) || { income: 0, expense: 0, net: 0 };
    const lastMonth = byMonth.find(m => m.monthISO === lastMonthISO) || { income: 0, expense: 0, net: 0 };

    const revenueDelta = thisMonth.income - lastMonth.income;
    const revenuePct = lastMonth.income > 0 ? ((revenueDelta / lastMonth.income) * 100) : 0;
    
    const expenseDelta = thisMonth.expense - lastMonth.expense;
    const expensePct = lastMonth.expense > 0 ? ((expenseDelta / lastMonth.expense) * 100) : 0;
    
    const netDelta = thisMonth.net - lastMonth.net;
    const netPct = lastMonth.net !== 0 ? ((netDelta / Math.abs(lastMonth.net)) * 100) : 0;

    const thisMonthVsLast = {
      thisMonth: {
        monthISO: thisMonthISO,
        income: thisMonth.income,
        expense: thisMonth.expense,
        net: thisMonth.net,
      },
      lastMonth: {
        monthISO: lastMonthISO,
        income: lastMonth.income,
        expense: lastMonth.expense,
        net: lastMonth.net,
      },
      revenueDelta,
      revenuePct: parseFloat(revenuePct.toFixed(2)),
      expenseDelta,
      expensePct: parseFloat(expensePct.toFixed(2)),
      netDelta,
      netPct: parseFloat(netPct.toFixed(2)),
    };

    // Overall totals
    const totalIncome = transactions
      .filter(t => t.kind === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = transactions
      .filter(t => t.kind === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return NextResponse.json({
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      summary: {
        totalIncome,
        totalExpense,
        totalNet: totalIncome - totalExpense,
      },
      byBranch,
      byMonth,
      thisMonthVsLast,
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Boss finance analytics error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
