// src/app/api/reports/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgIdFromSession } from "@/lib/api-helpers";

// 1. Defined explicit types to help TypeScript infer data downstream
type ReportInvoice = {
  number: string;
  status: string;
  total: any;
  dueDate: Date | string;
  createdAt: Date;
  client: { name: string };
  items: any[];
};

type ReportExpense = {
  category: string;
  amount: any;
  date: Date;
  notes: string | null;
};

export async function GET(req: Request) {
  const { orgId, error, status } = await getOrgIdFromSession();
  if (error || !orgId)
    return NextResponse.json({ error: error ?? "No organization" }, { status: status ?? 404 });

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "30";
  const days = parseInt(range);

  const from = new Date();
  from.setDate(from.getDate() - days);

  // 2. Cast the Promise.all result so 'invoices' and 'expenses' inherit strict types
  const [invoices, expenses, clients] = (await Promise.all([
    prisma.invoice.findMany({
      where: { orgId, createdAt: { gte: from } },
      include: { client: { select: { name: true } }, items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expense.findMany({
      where: { orgId, date: { gte: from } },
      orderBy: { date: "desc" },
    }),
    prisma.client.findMany({
      where: { orgId },
      include: { _count: { select: { invoices: true } } },
    }),
  ])) as [ReportInvoice[], ReportExpense[], any[]];

  // Revenue summary
  const paid = invoices.filter((i) => i.status === "PAID");
  const outstanding = invoices.filter((i) => i.status === "SENT" || i.status === "OVERDUE");
  
  // 3. Explicitly typed 's' as a number in reducers to prevent secondary inference errors
  const totalRevenue = paid.reduce((s: number, i) => s + Number(i.total), 0);
  const totalOutstanding = outstanding.reduce((s: number, i) => s + Number(i.total), 0);
  const totalExpenses = expenses.reduce((s: number, e) => s + Number(e.amount), 0);

  // Invoice status breakdown
  const statusBreakdown = {
    DRAFT: invoices.filter((i) => i.status === "DRAFT").length,
    SENT: invoices.filter((i) => i.status === "SENT").length,
    PAID: invoices.filter((i) => i.status === "PAID").length,
    OVERDUE: invoices.filter((i) => i.status === "OVERDUE").length,
  };

  // Revenue by client
  const revenueByClient: Record<string, number> = {};
  for (const inv of paid) {
    const name = inv.client.name;
    revenueByClient[name] = (revenueByClient[name] ?? 0) + Number(inv.total);
  }
  const topClients = Object.entries(revenueByClient)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Expense by category
  const expenseByCategory: Record<string, number> = {};
  for (const exp of expenses) {
    expenseByCategory[exp.category] =
      (expenseByCategory[exp.category] ?? 0) + Number(exp.amount);
  }
  const expenseBreakdown = Object.entries(expenseByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Invoice aging buckets
  const now = new Date();
  const aging = {
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    over90: 0,
  };
  for (const inv of outstanding) {
    const diffDays = Math.floor(
      (now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 0) aging.current += Number(inv.total);
    else if (diffDays <= 30) aging.days30 += Number(inv.total);
    else if (diffDays <= 60) aging.days60 += Number(inv.total);
    else if (diffDays <= 90) aging.days90 += Number(inv.total);
    else aging.over90 += Number(inv.total);
  }

  // Monthly trend (last 6 months)
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const label = d.toLocaleString("en-US", { month: "short", year: "numeric" });
    
    const monthRevenue = paid
      .filter(
        (inv) =>
          inv.createdAt.getMonth() === d.getMonth() &&
          inv.createdAt.getFullYear() === d.getFullYear()
      )
      .reduce((s: number, inv) => s + Number(inv.total), 0);
      
    const monthExpenses = expenses
      .filter(
        (exp) =>
          exp.date.getMonth() === d.getMonth() &&
          exp.date.getFullYear() === d.getFullYear()
      )
      .reduce((s: number, exp) => s + Number(exp.amount), 0);
      
    return { month: label, revenue: monthRevenue, expenses: monthExpenses };
  });

  return NextResponse.json({
    summary: {
      totalRevenue,
      totalOutstanding,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      invoiceCount: invoices.length,
      clientCount: clients.length,
      paidCount: paid.length,
      overdueCount: invoices.filter((i) => i.status === "OVERDUE").length,
    },
    statusBreakdown,
    topClients,
    expenseBreakdown,
    aging,
    monthlyTrend,
    invoices: invoices.map((inv) => ({
      number: inv.number,
      client: inv.client.name,
      status: inv.status,
      total: Number(inv.total),
      dueDate: inv.dueDate,
      createdAt: inv.createdAt,
    })),
    expenses: expenses.map((exp) => ({
      category: exp.category,
      amount: Number(exp.amount),
      date: exp.date,
      notes: exp.notes,
    })),
  });
}