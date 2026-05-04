// src/app/api/expenses/route.ts

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

  const expenses = await prisma.expense.findMany({
    where: { orgId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(session.user.id);
  if (!orgId)
    return NextResponse.json({ error: "No organization" }, { status: 404 });

  const { category, amount, date, notes } = await req.json();

  if (!category?.trim() || !amount || !date)
    return NextResponse.json(
      { error: "Category, amount and date are required" },
      { status: 400 }
    );

  const expense = await prisma.expense.create({
    data: {
      orgId,
      category,
      amount,
      date: new Date(date),
      notes,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}