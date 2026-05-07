import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgIdFromSession } from "@/lib/api-helpers";

export async function GET() {
  const { orgId, error, status } = await getOrgIdFromSession();
  if (error) return NextResponse.json({ error }, { status: status ?? 401 });

  const expenses = await prisma.expense.findMany({
    where: { orgId: orgId! },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const { orgId, error, status } = await getOrgIdFromSession();
  if (error) return NextResponse.json({ error }, { status: status ?? 401 });

  const { category, amount, date, notes } = await req.json();

  if (!category?.trim() || !amount || !date)
    return NextResponse.json(
      { error: "Category, amount and date are required" },
      { status: 400 }
    );

  const expense = await prisma.expense.create({
    data: { orgId: orgId!, category, amount, date: new Date(date), notes },
  });

  return NextResponse.json(expense, { status: 201 });
}