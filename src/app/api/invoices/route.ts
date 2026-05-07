import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgIdFromSession } from "@/lib/api-helpers";

export async function GET() {
  const { orgId, error, status } = await getOrgIdFromSession();
  if (error) return NextResponse.json({ error }, { status: status ?? 401 });

  const invoices = await prisma.invoice.findMany({
    where: { orgId: orgId! },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true, email: true } },
      items: true,
    },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const { orgId, error, status } = await getOrgIdFromSession();
  if (error) return NextResponse.json({ error }, { status: status ?? 401 });

  const { clientId, dueDate, notes, items } = await req.json();

  if (!clientId || !dueDate || !items?.length)
    return NextResponse.json(
      { error: "Client, due date and at least one item are required" },
      { status: 400 }
    );

  const count = await prisma.invoice.count({ where: { orgId: orgId! } });
  const number = `INV-${String(count + 1).padStart(4, "0")}`;

  const total = items.reduce(
    (sum: number, item: { quantity: number; unitPrice: number }) =>
      sum + item.quantity * item.unitPrice,
    0
  );

  const invoice = await prisma.invoice.create({
    data: {
      orgId: orgId!,
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