import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgIdFromSession } from "@/lib/api-helpers";

export async function GET() {
  const { orgId, error, status } = await getOrgIdFromSession();
  if (error) return NextResponse.json({ error }, { status: status ?? 401 });

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      label: date.toLocaleString("en-US", { month: "short" }),
    };
  });

  const [invoices, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { orgId: orgId!, status: "PAID", createdAt: { gte: sixMonthsAgo } },
      select: { total: true, createdAt: true },
    }),
    prisma.expense.findMany({
      where: { orgId: orgId!, date: { gte: sixMonthsAgo } },
      select: { amount: true, date: true, category: true },
    }),
  ]);

  const revenueByMonth = months.map(({ year, month, label }) => {
    // Added explicit types for 'inv' to fix the implicit 'any' error
    const revenue = invoices
      .filter((inv: { createdAt: Date; total: any }) => inv.createdAt.getFullYear() === year && inv.createdAt.getMonth() === month)
      .reduce((sum: number, inv: { total: any }) => sum + Number(inv.total), 0);

    // Added explicit types for 'exp' to prevent the same error from happening here
    const expense = expenses
      .filter((exp: { date: Date; amount: any }) => exp.date.getFullYear() === year && exp.date.getMonth() === month)
      .reduce((sum: number, exp: { amount: any }) => sum + Number(exp.amount), 0);

    return { month: label, revenue, expenses: expense };
  });

  const categoryMap: Record<string, number> = {};
  for (const exp of expenses) {
    categoryMap[exp.category] = (categoryMap[exp.category] ?? 0) + Number(exp.amount);
  }
  
  const expenseByCategory = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return NextResponse.json({ revenueByMonth, expenseByCategory });
}