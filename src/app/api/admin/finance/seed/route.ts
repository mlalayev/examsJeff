import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/admin/finance/seed?months=6 - Create demo finance transactions
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const role = (user as any).role;
    
    if (role !== "BOSS" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin or Boss access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get("months") || "6");

    // Get all branches
    const branches = await prisma.branch.findMany();
    
    if (branches.length === 0) {
      return NextResponse.json({ error: "No branches found. Please create branches first." }, { status: 400 });
    }

    const categories = {
      INCOME: ["TUITION", "EXAM", "MATERIAL", "OTHER"],
      EXPENSE: ["RENT", "SALARY", "MATERIAL", "OTHER"],
    };

    const transactions = [];
    const now = new Date();

    // Generate transactions for each month
    for (let monthOffset = 0; monthOffset < months; monthOffset++) {
      const monthDate = new Date(now);
      monthDate.setMonth(monthDate.getMonth() - monthOffset);
      
      // For each branch
      for (const branch of branches) {
        // Generate 5-15 income transactions per month
        const incomeCount = Math.floor(Math.random() * 11) + 5;
        for (let i = 0; i < incomeCount; i++) {
          const day = Math.floor(Math.random() * 28) + 1;
          const occurredAt = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
          const category = categories.INCOME[Math.floor(Math.random() * categories.INCOME.length)];
          
          // Income amounts vary by category
          let amount = 0;
          if (category === "TUITION") {
            amount = Math.floor(Math.random() * 300) + 200; // 200-500 AZN
          } else if (category === "EXAM") {
            amount = Math.floor(Math.random() * 100) + 50; // 50-150 AZN
          } else if (category === "MATERIAL") {
            amount = Math.floor(Math.random() * 50) + 20; // 20-70 AZN
          } else {
            amount = Math.floor(Math.random() * 150) + 50; // 50-200 AZN
          }

          transactions.push({
            branchId: branch.id,
            kind: "INCOME",
            category,
            amount,
            currency: "AZN",
            occurredAt,
            meta: {
              seeded: true,
              description: `Demo ${category.toLowerCase()} income`,
            },
          });
        }

        // Generate 3-8 expense transactions per month
        const expenseCount = Math.floor(Math.random() * 6) + 3;
        for (let i = 0; i < expenseCount; i++) {
          const day = Math.floor(Math.random() * 28) + 1;
          const occurredAt = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
          const category = categories.EXPENSE[Math.floor(Math.random() * categories.EXPENSE.length)];
          
          // Expense amounts vary by category
          let amount = 0;
          if (category === "RENT") {
            amount = Math.floor(Math.random() * 500) + 500; // 500-1000 AZN
          } else if (category === "SALARY") {
            amount = Math.floor(Math.random() * 1000) + 1000; // 1000-2000 AZN
          } else if (category === "MATERIAL") {
            amount = Math.floor(Math.random() * 100) + 50; // 50-150 AZN
          } else {
            amount = Math.floor(Math.random() * 200) + 100; // 100-300 AZN
          }

          transactions.push({
            branchId: branch.id,
            kind: "EXPENSE",
            category,
            amount,
            currency: "AZN",
            occurredAt,
            meta: {
              seeded: true,
              description: `Demo ${category.toLowerCase()} expense`,
            },
          });
        }
      }
    }

    // Insert all transactions
    const result = await prisma.financeTxn.createMany({
      data: transactions,
    });

    // Calculate summary statistics
    const totalIncome = transactions
      .filter(t => t.kind === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.kind === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      message: "Finance transactions seeded successfully",
      summary: {
        monthsGenerated: months,
        branchesCount: branches.length,
        transactionsCreated: result.count,
        totalIncome,
        totalExpense,
        totalNet: totalIncome - totalExpense,
      },
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Finance seed error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
