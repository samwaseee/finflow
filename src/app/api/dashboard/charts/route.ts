// src/app/api/dashboard/charts/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOrgId(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    select: { orgId: true },
  });
  return membership?.orgId;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(session.user.id);
  if (!orgId)
    return NextResponse.json({ error: "No organization" }, { status: 404 });

  // Last 6 months
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      label: date.toLocaleString("en-US", { month: "short" }),
    };
  });

  // Fetch invoices and expenses for last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [invoices, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        orgId,
        status: "PAID",
        createdAt: { gte: sixMonthsAgo },
      },
      select: { total: true, createdAt: true },
    }),
    prisma.expense.findMany({
      where: {
        orgId,
        date: { gte: sixMonthsAgo },
      },
      select: { amount: true, date: true, category: true },
    }),
  ]);

  // Build monthly revenue vs expenses
  const revenueByMonth = months.map(({ year, month, label }) => {
    const revenue = invoices
      .filter(
        (inv) =>
          inv.createdAt.getFullYear() === year &&
          inv.createdAt.getMonth() === month
      )
      .reduce((sum, inv) => sum + Number(inv.total), 0);

    const expense = expenses
      .filter(
        (exp) =>
          exp.date.getFullYear() === year &&
          exp.date.getMonth() === month
      )
      .reduce((sum, exp) => sum + Number(exp.amount), 0);

    return { month: label, revenue, expenses: expense };
  });

  // Build expense breakdown by category
  const categoryMap: Record<string, number> = {};
  for (const exp of expenses) {
    categoryMap[exp.category] = (categoryMap[exp.category] ?? 0) + Number(exp.amount);
  }
  const expenseByCategory = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return NextResponse.json({ revenueByMonth, expenseByCategory });
}