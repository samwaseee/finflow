// src/app/api/invoices/route.ts

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

// GET /api/invoices
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(session.user.id);
  if (!orgId)
    return NextResponse.json({ error: "No organization" }, { status: 404 });

  const invoices = await prisma.invoice.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true, email: true } },
      items: true,
    },
  });

  return NextResponse.json(invoices);
}

// POST /api/invoices
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(session.user.id);
  if (!orgId)
    return NextResponse.json({ error: "No organization" }, { status: 404 });

  const { clientId, dueDate, notes, items } = await req.json();

  if (!clientId || !dueDate || !items?.length)
    return NextResponse.json(
      { error: "Client, due date and at least one item are required" },
      { status: 400 }
    );

  // generate invoice number e.g. INV-0042
  const count = await prisma.invoice.count({ where: { orgId } });
  const number = `INV-${String(count + 1).padStart(4, "0")}`;

  // calculate total
  const total = items.reduce(
    (sum: number, item: { quantity: number; unitPrice: number }) =>
      sum + item.quantity * item.unitPrice,
    0
  );

  const invoice = await prisma.invoice.create({
    data: {
      orgId,
      clientId,
      number,
      dueDate: new Date(dueDate),
      notes,
      total,
      status: "DRAFT",
      items: {
        create: items.map((item: { description: string; quantity: number; unitPrice: number }) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
    include: {
      client: { select: { name: true, email: true } },
      items: true,
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}